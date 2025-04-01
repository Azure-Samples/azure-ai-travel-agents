import {
  ElementRef,
  Injectable,
  NgZone,
  signal,
  WritableSignal,
} from '@angular/core';
import { ApiService, ChatEvent, Tools } from '../services/api.service';
import { BehaviorSubject, delay } from 'rxjs';
import { debounceTime, Subject } from 'rxjs';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    event?: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  userMessage = signal('');
  agentMessage = new BehaviorSubject<string>('');
  agentEventStream = new BehaviorSubject<ChatEvent | null>(null);
  messages = signal<ChatMessage[]>([]);
  agentMessageBuffer = '';

  isLoading = signal(false);
  tools: WritableSignal<Tools> = signal({
    search: false,
    echo: false,
    customer_query: false,
  });
  currentAgentName = signal<string | null>(null);
  assistantMessageInProgress = signal(false);

  constructor(private apiService: ApiService, private zone: NgZone) {
    this.agentMessageBuffer = '';
    this.apiService.chatStreamState.pipe(delay(100)).subscribe((state) => {
      for (const event of state?.events || []) {
        this.processStreamEvent(event);
      }
    });
  }

  async sendMessage() {
    const messageText = this.userMessage();
    if (!messageText.trim()) return;

    this.messages.update((msgs) => [
      ...msgs,
      {
        role: 'user',
        content: messageText,
        timestamp: new Date(),
      },
      {
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      },
    ]);

    this.userMessage.set('');
    this.isLoading.set(true);
    this.assistantMessageInProgress.set(false);
    await this.apiService.streamChatMessage(messageText, this.tools());
    this.isLoading.set(false);
  }

  private processStreamEvent(event: ChatEvent): ChatMessage | null {
    if (event.type === 'metadata') {
      this.currentAgentName.set(event.data?.agentName || null);
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
}
