import { Injectable, signal } from '@angular/core';
import { toast } from 'ngx-sonner';
import { BehaviorSubject } from 'rxjs';
import {
  ApiService,
  ChatEvent,
  ChatMessage,
  ChatStreamState,
  Tools,
} from '../services/api.service';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  userMessage = signal('');
  // agentMessageStream = new BehaviorSubject<string>('');
  // agentEventStream = new BehaviorSubject<ChatEvent | null>(null);
  messagesStream = new BehaviorSubject<ChatMessage[]>([]);
  private messagesBuffer: ChatMessage[] = [];
  private agentEventsBuffer: ChatEvent[] = [];

  isLoading = signal(false);
  tools = signal<Tools[]>([]);
  agent = signal<string | null>(null);
  assistantMessageInProgress = signal(false);
  agentMessageBuffer: string = '';

  constructor(private apiService: ApiService) {
    this.apiService.chatStreamState.subscribe(
      (state: Partial<ChatStreamState>) => {
        console.log('Chat stream state update:', { state });

        switch (state.type) {
          case 'START':
            this.agentEventsBuffer = [];
            this.messagesBuffer.push({
              role: 'assistant',
              content: '',
              reasoning: [],
              timestamp: new Date(),
            });
            this.messagesStream.next(this.messagesBuffer);
            break;

          case 'END':
            this.updateAndNotifyAgentChatMessageState('', {
              metadata: {
                events: this.agentEventsBuffer,
              },
            });
            break;

          case 'MESSAGE':
            this.processAgentEvents(state.event);
            break;

          case 'ERROR':
            this.showErrorMessage(state.error);
            this.isLoading.set(false);
            break;

          default:
            break;
        }
      }
    );
  }

  async fetchAvailableTools() {
    const toolsResult = await this.apiService.fetchAvailableTools();
    if (toolsResult) {
      this.tools.set(toolsResult.tools.filter((tool) => tool.selected));
    }
  }

  async sendMessage(event: Event) {
    if ((event as KeyboardEvent).shiftKey) {
      return;
    }

    const messageText = this.userMessage();
    if (!messageText.trim()) return;

    this.messagesBuffer.push({
      role: 'user',
      content: messageText,
      reasoning: [],
      timestamp: new Date(),
    });

    this.userMessage.set('');
    this.isLoading.set(true);
    this.assistantMessageInProgress.set(false);

    // // clear all buffers
    // this.agentMessageStream.next('');
    // this.agentEventStream.next(null);
    // this.agentEventsBuffer = [];
    // this.messagesStream.next(this.messagesBuffer);
    // this.agent.set(null);

    await this.apiService.streamChatMessage(
      messageText,
      this.tools().filter((tool) => tool.selected)
    );
  }

  showErrorMessage(error: unknown) {
    const err = (error as any).error ?? error;

    toast.error('Oops! Something went wrong.', {
      duration: 10000,
      description: err.message,
      action: {
        label: 'Close',
        onClick: () => console.log('Closed'),
      },
    });
  }

  private processAgentEvents(event?: ChatEvent) {
    if (event && event.type === 'metadata') {
      this.agent.set(event.data?.agent || null);
      this.agentEventsBuffer.push(event);

      console.log(event.event);

      let message: string = event.data?.message || '';
      if (message) {
        message +='\n';
      }
      const delta: string = (event.data?.delta || message) || '';

      switch (event.event) {
        // LlamaIndex events
        case 'StartEvent':
        // Microsoft Agent Framework (MAF) events
        case 'WorkflowStarted':
        case 'OrchestratorUserTask':
        case 'OrchestratorInstruction':
          this.updateAndNotifyAgentChatMessageState(delta, {
            metadata: {
              events: this.agentEventsBuffer,
            },
          });

          this.assistantMessageInProgress.set(false);
          break;

        // LlamaIndex events
        case 'StopEvent':

        // Microsoft Agent Framework (MAF) events
        case "Complete":
          this.updateAndNotifyAgentChatMessageState(delta, {
            metadata: {
              events: this.agentEventsBuffer,
            },
          });

          this.assistantMessageInProgress.set(false);
          this.isLoading.set(false);
          break;

        // LlamaIndex events
        case 'AgentToolCallResult':
          let state = {};
          if (typeof event.data.raw === 'string') {
            state = {
              reasoning: [
                {
                  content: event.data.raw,
                },
              ],
            };
          }
          this.updateAndNotifyAgentChatMessageState(delta, state);
          break;

        // LlamaIndex events
        case 'AgentOutput':
        case 'AgentInput':
        case 'AgentSetup':
        case 'AgentStepEvent':
        case 'AgentToolCall':
        case 'ToolResultsEvent':
        case 'ToolCallsEvent':
          this.updateAndNotifyAgentChatMessageState(delta, {
            metadata: {
              events: this.agentEventsBuffer,
            },
          });
          break;

        // LlamaIndex events
        case 'AgentStream':

        // Microsoft Agent Framework (MAF) events
        case 'AgentDelta':
          console.log({delta});

          if (delta.trim()) {
            this.assistantMessageInProgress.set(true);
            this.agentEventsBuffer.push(event);
            this.updateAndNotifyAgentChatMessageState(delta, {
              metadata: {
                events: this.agentEventsBuffer,
              },
            });
          }
          break;
      }
    }
  }

  updateAndNotifyAgentChatMessageState(
    delta: string,
    state?: Partial<ChatMessage>
  ) {
    const lastMessage = this.messagesBuffer[this.messagesBuffer.length - 1];
    if (lastMessage?.role === 'assistant') {
      lastMessage.content += delta;
      lastMessage.metadata = {
        ...lastMessage.metadata,
        ...state?.metadata,
        events: state?.metadata?.events,
      };
      lastMessage.reasoning = [
        ...(lastMessage.reasoning || []),
        ...(state?.reasoning || []),
      ];
      lastMessage.timestamp = new Date();
      this.messagesStream.next([...this.messagesBuffer]);
    }
  }

  resetChat() {
    this.userMessage.set('');
    this.messagesBuffer = [];
    this.messagesStream.next(this.messagesBuffer);
    this.agentEventsBuffer = [];
    this.isLoading.set(false);
    this.assistantMessageInProgress.set(false);
    this.agent.set(null);
  }
}
