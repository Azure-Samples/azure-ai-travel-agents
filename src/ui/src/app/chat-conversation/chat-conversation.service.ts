import { computed, Injectable, signal, WritableSignal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ApiService, ChatEvent, Tools } from '../services/api.service';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    events?: ChatEvent[] | null;
  };
}

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  userMessage = signal('');
  agentMessage = new BehaviorSubject<string>('');
  agentEventStream = new BehaviorSubject<ChatEvent | null>(null);
  messages = computed(() => {
    return this.nextConversationTurn();
  });
  nextConversationTurn = signal<ChatMessage[]>([]);
  agentMessageBuffer = '';
  agentEventsBuffer: ChatEvent[] = [];

  isLoading = signal(false);
  tools: WritableSignal<Tools> = signal({
    search: false,
    echo: false,
    customer_query: false,
  });
  currentAgentName = signal<string | null>(null);
  assistantMessageInProgress = signal(false);

  constructor(private apiService: ApiService) {
    this.agentMessageBuffer = '';
    this.apiService.chatStreamState.subscribe((state) => {
      if (state.isStart) {
        this.nextConversationTurn.update((msgs: ChatMessage[]) => [
          ...msgs,
          {
            role: 'assistant',
            content: this.agentMessageBuffer,
            timestamp: new Date(),
          }
        ]);
      }
      else if (state.isEnd) {
        this.nextConversationTurn.update((msgs: ChatMessage[]) => {
          const lastMessage = msgs[msgs.length - 1];
          if (lastMessage && lastMessage.role === 'assistant') {
            lastMessage.content += this.agentMessageBuffer;
            lastMessage.metadata = {
              events: this.agentEventsBuffer,
            };
          }
          return [...msgs];
        });
      }
      else {
        this.processStreamEvent(state.event);
      }
    });
  }

  async sendMessage() {
    const messageText = this.userMessage();
    if (!messageText.trim()) return;

    this.nextConversationTurn.update((msgs: ChatMessage[]) => [
      ...msgs,
      {
        role: 'user',
        content: messageText,
        timestamp: new Date(),
      }
    ]);

    this.userMessage.set('');
    this.isLoading.set(true);
    this.assistantMessageInProgress.set(false);
    await this.apiService.streamChatMessage(messageText, this.tools());
    this.isLoading.set(false);
  }

  private processStreamEvent(event?: ChatEvent): ChatMessage | null {
    if (!event) return null;

    if (event.type === 'metadata') {
      this.currentAgentName.set(event.data?.agentName || null);
      this.agentEventsBuffer.push(event);

      const delta = event.data?.delta || '';

      console.info('Processing event type=', event.event, { event });

      switch (event.event) {
        case 'StartEvent':
          this.agentEventStream.next(event);
          this.assistantMessageInProgress.set(false);
          break;
        case 'StopEvent':
          this.agentEventStream.next(event);
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
          this.agentEventStream.next(event);
          break;

        case 'AgentStream':
          this.assistantMessageInProgress.set(true);

          if (delta.trim()) {
            this.agentMessageBuffer += delta;
            this.agentMessage.next(this.agentMessageBuffer);
            console.log('Agent message buffer:', this.agentMessageBuffer);
          }
          break;
      }
    }

    return null;
  }

  resetChat() {
    this.agentMessageBuffer = '';
    this.userMessage.set('');
    this.agentMessage.next('');
    this.agentEventStream.next(null);
    this.assistantMessageInProgress.set(false);
    this.isLoading.set(false);
  }
}
