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
  messages = signal<ChatMessage[]>([]);
  agentMessageBuffer = '';

  isLoading = signal(false);
  tools: WritableSignal<Tools> = signal({ search: false, echo: false, customer_query: false });
  currentAgentName = signal<string | null>(null);
  assistantMessageInProgress = signal(false);
  private agentMessageSubject = new Subject<string>();

  constructor(private apiService: ApiService, private zone: NgZone) {
    this.agentMessageBuffer = '';
    this.apiService.chatStreamState.pipe(
      delay(100)
    ).subscribe((state) => {
      console.log('Chat stream state:', state);
      for (const event of state?.events || []) {
        this.processStreamEvent(event);
      }
    });

    // Buffer agentMessage emissions to smoothen typing effect
    this.agentMessageSubject.pipe(debounceTime(50)).subscribe((bufferedMessage) => {
      this.agentMessage.next(bufferedMessage);
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
      const role = event.data?.response?.role || 'assistant';
      const delta = event.data?.delta || '';

      console.warn('Processing event type=', event.event, { event });
      switch (event.event) {
        case 'StartEvent':
          this.assistantMessageInProgress.set(false);
          break;
        case 'StopEvent':
          this.assistantMessageInProgress.set(false);
          this.isLoading.set(false);
          break;
        case 'AgentStream':
          this.assistantMessageInProgress.set(true);

          if (delta.trim()) {
            this.agentMessageBuffer += delta;
            this.agentMessageSubject.next(this.agentMessageBuffer);
            console.log('Agent message buffer:', this.agentMessageBuffer);
          }
          break;
        default:
        // console.warn('Unhandled event type:', event.event);
      }
    }

    return null;
  }

  private prependDeltaMessage(
    delta: string,
    role: 'user' | 'assistant' = 'assistant',
    clear = false
  ) {
    this.messages.update((msgs) => {
      const lastMessage = msgs.pop();
      if (lastMessage && lastMessage.role === role) {
        if (clear) {
          lastMessage.content = '';
        }
        lastMessage.content += delta;
        return [...msgs, lastMessage];
      }

      return msgs;
    });
  }
}
