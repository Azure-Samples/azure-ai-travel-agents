import { ElementRef, Injectable, signal, WritableSignal } from '@angular/core';
import { ApiService, ChatEvent, Tools } from '../services/api.service';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    agent?: string;
    event?: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  userMessage = signal('');
  messages = signal<ChatMessage[]>([]);

  isLoading = signal(false);
  tools: WritableSignal<Tools> = signal({ search: false });
  currentAgentName = signal<string | null>(null);
  assistantMessageInProgress = signal(false);

  private chatContainerRef: ElementRef | null = null;

  constructor(private apiService: ApiService) {
    this.apiService.chatStreamState.subscribe((state) => {
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
        content: 'Thinking', // Placeholder for assistant message
        timestamp: new Date(),
      },
    ]);

    this.userMessage.set('');
    this.isLoading.set(true);
    this.assistantMessageInProgress.set(false);
    await this.apiService.streamChatMessage(messageText, this.tools());
  }

  private processStreamEvent(event: ChatEvent): ChatMessage | null {
    if (event.type === 'metadata') {
      this.currentAgentName.set(event.data?.agentName || null);
      const role = event.data?.response?.role || 'assistant';
      const delta = event.data?.delta || '';

      switch (event.event) {
        case 'StartEvent':
          this.assistantMessageInProgress.set(false);
          this.isLoading.set(true);
          break;
        case 'StopEvent':
          this.assistantMessageInProgress.set(false);
          this.isLoading.set(false);
          break;
        case 'AgentStream':
          this.assistantMessageInProgress.set(true);

          if (delta.trim()) {
            this.prependDeltaMessage(delta, role);
          }
          break;
        default:
          console.warn('Unhandled event type:', event.event);
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
