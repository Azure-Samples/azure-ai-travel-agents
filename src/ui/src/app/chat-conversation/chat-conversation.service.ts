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
  currentAgentName = signal<string | null>(null);
  assistantMessageInProgress = signal(false);
  agentMessageBuffer: string = '';

  constructor(private apiService: ApiService) {
    this.apiService.chatStreamState.subscribe(
      (state: Partial<ChatStreamState>) => {
        switch (state.type) {
          case 'START':
            this.agentEventsBuffer = [];
            this.messagesBuffer.push({
              role: 'assistant',
              content: '',
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
            this.isLoading.set(false);
            break;

          case 'MESSAGE':
            this.processAgentEvents(state.event);
            break;

          case 'ERROR':
            this.showErrorMessage(state.error);
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
      this.tools.set(toolsResult.tools);
    }
  }

  async sendMessage() {
    const messageText = this.userMessage();
    if (!messageText.trim()) return;

    this.messagesBuffer.push({
      role: 'user',
      content: messageText,
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
    // this.currentAgentName.set(null);

    await this.apiService.streamChatMessage(
      messageText,
      this.tools().filter((tool) => tool.selected)
    );
  }

  showErrorMessage(error: unknown) {
    toast.error('Oops! Something went wrong.', {
      duration: 5000,
      description: (error as Error).message,
      action: {
        label: 'Close',
        onClick: () => console.log('Closed'),
      },
    });
  }

  private processAgentEvents(event?: ChatEvent) {
    if (event && event.type === 'metadata') {
      this.currentAgentName.set(event.data?.agentName || null);
      this.agentEventsBuffer.push(event);

      const delta: string = event.data?.delta || '';

      switch (event.event) {
        case 'StartEvent':
          this.updateAndNotifyAgentChatMessageState(delta, {
            metadata: {
              events: this.agentEventsBuffer,
            },
          });

          this.assistantMessageInProgress.set(false);
          break;
        case 'StopEvent':
          this.updateAndNotifyAgentChatMessageState(delta, {
            metadata: {
              events: this.agentEventsBuffer,
            },
          });

          this.assistantMessageInProgress.set(false);
          this.isLoading.set(false);
          break;
        case 'AgentOutput':
        case 'AgentInput':
        case 'AgentSetup':
        case 'AgentStepEvent':
        case 'AgentToolCallResult':
        case 'AgentToolCall':
        case 'ToolResultsEvent':
        case 'ToolCallsEvent':
          this.updateAndNotifyAgentChatMessageState(delta, {
            metadata: {
              events: this.agentEventsBuffer,
            },
          });
          break;

        case 'AgentStream':
          this.assistantMessageInProgress.set(true);

          if (delta.trim()) {
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
    this.currentAgentName.set(null);
  }
}
