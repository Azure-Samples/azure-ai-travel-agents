import ModelClient, {
  ChatRequestMessage,
  isUnexpected,
  ModelClient as ModelClientType,
} from '@azure-rest/ai-inference';
import {
  AIProjectsClient,
  CreateAgentOptionalParams,
  CreateAgentThreadOptionalParams,
  DoneEvent,
  ErrorEvent,
  MessageDeltaChunk,
  MessageDeltaTextContent,
  MessageStreamEvent,
  RunStreamEvent,
  ThreadMessageOptions,
  ThreadRunOutput,
  UpdateAgentOptionalParams,
  UpdateAgentThreadOptionalParams
} from '@azure/ai-projects';
import { DefaultAzureCredential } from '@azure/identity';
import { Injectable } from '@nestjs/common';

import * as dotenv from 'dotenv';
dotenv.config();

// Connection info and authentication for Azure AI Agents API
const AZURE_AI_PROJECTS_CONNECTION_STRING =
  process.env['AZURE_AI_PROJECTS_CONNECTION_STRING'] ||
  '<insert your Azure OpenAI API version here>';
const AZURE_INFERENCE_ENDPOINT =
  process.env['AZURE_INFERENCE_ENDPOINT'] ||
  '<insert   your Azure OpenAI API version here>';
const AZURE_INFERENCE_MODEL =
  process.env['AZURE_INFERENCE_MODEL'] || '<insert your Azure OpenAI API version here>';

@Injectable()
export class AzureAIService {
  private aiClient: AIProjectsClient | null = null;
  private chatClient: ModelClientType | null = null;
  private storedThreads: any[] = [];

  initAzureAIClient() {
    if (!AZURE_AI_PROJECTS_CONNECTION_STRING) {
      throw new Error(
        'The AZURE_AI_PROJECTS_CONNECTION_STRING environment variable is missing or empty.',
      );
    }

    if (!this.aiClient) {
      this.aiClient = AIProjectsClient.fromConnectionString(
        AZURE_AI_PROJECTS_CONNECTION_STRING,
        new DefaultAzureCredential(),
      );
    }

    return this.aiClient;
  }

  initChatClient() {
    if (!this.chatClient) {
      this.chatClient = ModelClient(
        AZURE_INFERENCE_ENDPOINT,
        new DefaultAzureCredential(),
      );
    }
    return this.chatClient;
  }

  // Agent methods
  async retrieveAgent(agentId: string) {
    const client = this.initAzureAIClient();
    return await client.agents.getAgent(agentId);
  }

  async createAgent(model: string, options?: CreateAgentOptionalParams) {
    const client = this.initAzureAIClient();
    return await client.agents.createAgent(model, options);
  }

  async updateAgent(agentId: string, options: UpdateAgentOptionalParams) {
    const client = this.initAzureAIClient();

    // Clean up properties that shouldn't be in the update
    delete options.metadata;
    options.description = options.description || '';

    return await client.agents.updateAgent(agentId, options);
  }

  async listAgents() {
    const client = this.initAzureAIClient();
    return await client.agents.listAgents();
  }

  async deleteAgent(agentId: string) {
    const client = this.initAzureAIClient();
    return await client.agents.deleteAgent(agentId);
  }

  // Thread methods
  async createOrRetrieveThread(content: string, threadId: string) {
    const client = this.initAzureAIClient();

    if (threadId) {
      return await client.agents.getThread(threadId);
    } else {
      const threadParams: CreateAgentThreadOptionalParams = {
        messages: [
          {
            role: 'user',
            content,
          },
        ],
      };
      return await client.agents.createThread(threadParams);
    }
  }

  async *postQueryAndStreamResponse(
    agentId: string,
    threadId: string,
    content: { role: 'user' | 'assistant'; content: string },
  ) {
    const client = this.initAzureAIClient();

    try {
      // Create message in the thread
      await client.agents.createMessage(threadId, {
        role: content.role,
        content: content.content,
      });

      // If message is from assistant, just return (no response needed)
      if (content.role === 'assistant') {
        yield;
        return;
      }

      // Run the thread with the assistant
      const agentParams: any /*CreateAndRunThreadOptionalParams*/ = {
        assistantId: agentId,
      };

      const responseStream = await client.agents
        .createThreadAndRun(threadId, agentParams)
        .stream();
      for await (const eventMessage of responseStream) {
        switch (eventMessage.event) {
          case RunStreamEvent.ThreadRunCreated:
            console.log(
              `ThreadRun status: ${(eventMessage.data as ThreadRunOutput).status}`,
            );
            yield Buffer.from('thread.run.created');
            break;
          case MessageStreamEvent.ThreadMessageDelta:
            {
              const messageDelta = eventMessage.data as MessageDeltaChunk;
              for (const contentPart of messageDelta.delta.content) {
                if (contentPart.type === 'text') {
                  const textContent = contentPart as MessageDeltaTextContent;
                  const textValue = textContent.text?.value || 'No text';
                  console.log(`Text delta received:: ${textValue}`);
                  yield Buffer.from(textValue);
                }
              }
            }
            break;

          case RunStreamEvent.ThreadRunCompleted:
            console.log('Thread Run Completed');
            yield Buffer.from('thread.run.completed');
            break;
          case ErrorEvent.Error:
            console.log(`An error occurred. Data ${eventMessage.data}`);
            yield Buffer.from(eventMessage.data.toString());
            break;
          case DoneEvent.Done:
            console.log('Stream completed.');
            yield Buffer.from('stream.completed');
            break;
        }
      }
    } catch (error) {
      console.error('Stream error:', error);
      yield Buffer.from(error.message);
    }
  }

  async createThread() {
    const client = this.initAzureAIClient();
    const thread = await client.agents.createThread({});
    this.insertThread(thread);
    return thread;
  }

  async saveThread(threadId: string, thread: UpdateAgentThreadOptionalParams) {
    const client = this.initAzureAIClient();
    const updatedThread = await client.agents.updateThread(threadId, thread);
    const idx = this.storedThreads.findIndex(
      (thread) => thread.id === threadId,
    );
    this.storedThreads[idx] = updatedThread;
    return updatedThread;
  }

  async loadThread(threadId: string) {
    const client = this.initAzureAIClient();
    return await client.agents.getThread(threadId);
  }

  async loadThreadMessages(threadId: string) {
    const client = this.initAzureAIClient();
    const messages = await client.agents.listMessages(threadId);
    messages.data.reverse();
    return messages;
  }

  async createThreadMessage(threadId: string, message: ThreadMessageOptions) {
    const client = this.initAzureAIClient();
    return await client.agents.createMessage(threadId, message);
  }

  async deleteThread(threadId: string) {
    const client = this.initAzureAIClient();
    const response = await client.agents.deleteThread(threadId);

    if (response.deleted) {
      const idx = this.storedThreads.findIndex(
        (thread) => thread.id === threadId,
      );
      this.storedThreads.splice(idx, 1);
    }

    return response;
  }

  insertThread(thread: any) {
    return this.storedThreads.push(thread);
  }

  async listThreads() {
    return Promise.resolve(
      this.storedThreads.sort(
        (threadA: any, threadB: any) => threadB.created_at - threadA.created_at,
      ),
    );
  }

  async generateThreadTitle(user: string, assistant: string) {
    let messages: Array<ChatRequestMessage> = [
      {
        role: 'system',
        content:
          'You are a helpful assistant that answers questions, and on 2nd turn, will suggest a title for the interaction.',
      },
      { role: 'user', content: user },
      { role: 'assistant', content: assistant },
      {
        role: 'system',
        content:
          "Please suggest a title for this interaction. Don't be cute or humorous in your answer. Answer only with a factual descriptive title. Do not use quotes. Do not prefix with 'Title:' or anything else. Just emit the title.",
      },
    ];

    const client = this.initChatClient();
    const response = await client.path('/chat/completions').post({
      body: {
        messages,
        model: AZURE_INFERENCE_MODEL,
      },
    });

    if (isUnexpected(response)) {
      throw response.body.error;
    }

    return response.body.choices[0].message.content || null;
  }

  async listRuns(threadId: string) {
    const client = this.initAzureAIClient();
    return await client.agents.listRuns(threadId);
  }

  // Tools handling
  // private async *handleToolExecution(
  //   toolEvent: any,
  //   threadId: string,
  //   responseStream: AIResponseStream,
  // ) {
  //   try {
  //     const tools = ToolsFactory.getTools();
  //     const toolOutputs = await Promise.all(
  //       toolEvent.tools.map(async (toolCall) => {
  //         let output = `@@${toolCall.name} not found`;

  //         if (
  //           tools[toolCall.name] &&
  //           typeof tools[toolCall.name] === 'function'
  //         ) {
  //           const args = toolCall.input || {};
  //           output = await tools[toolCall.name](args.symbol);
  //         }

  //         return {
  //           toolCallId: toolCall.id,
  //           output: output,
  //         };
  //       }),
  //     );

  //     // Submit tool outputs back to the stream
  //     await responseStream.submitToolOutputs(toolOutputs);

  //     // Continue processing the stream after tool outputs
  //     for await (const chunk of responseStream) {
  //       if (chunk.contentEvent) {
  //         if (chunk.contentEvent.delta.content) {
  //           yield Buffer.from(chunk.contentEvent.delta.content);
  //         }
  //       } else if (chunk.runCompletedEvent) {
  //         yield Buffer.from('thread.run.completed');
  //       } else {
  //         console.log('Other event after tool execution:', chunk);
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Error processing tool execution:', error);
  //     yield Buffer.from(`Error executing tools: ${error.message}`);
  //   }
  // }
}
