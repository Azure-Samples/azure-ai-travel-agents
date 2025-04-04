import { inject, Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

export type Tools = {
  search: boolean;
  echo: boolean;
  customer_query: boolean;
};

// Interface for SSE event types
export interface ChatEvent {
  type: 'metadata' | 'error' | 'end';
  agent?: string;
  event?: string;
  data?: any;
  message?: string;
  statusCode?: number;
}

export type ChatEventErrorType = 'client' | 'server' | 'general' | undefined;
export interface ChatStreamState {
  event: ChatEvent;
  type: 'START' | 'END' | 'ERROR' | 'MESSAGE';
  error?: {
    type: ChatEventErrorType;
    message: string;
    statusCode: number;
  };
}

export interface ChatMessage {
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
export class ApiService {
  ngZone = inject(NgZone);
  private apiUrl = environment.apiServerUrl;
  chatStreamState = new BehaviorSubject<Partial<ChatStreamState>>({});

  async streamChatMessage(message: string, tools: Tools) {
    try {
      const response = await fetch(`${this.apiUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, tools }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        return this.handleApiError(
          new Error(error || 'An error occurred'),
          response.status
        );
      }

      const decoder = new TextDecoder('utf-8');

      if (!response.body) {
        throw new Error('Readable stream not supported');
      }

      this.chatStreamState.next({ type: 'START' });

      for await (const chunk of response.body) {
        const value = decoder.decode(chunk, { stream: true });

        // Split the chunk by double newlines to handle multiple JSON values
        const jsonValues = value.trim().split(/\n\n+/);

        for (const jsonValue of jsonValues) {
          try {
            const parsedData = JSON.parse(jsonValue);
            this.chatStreamState.next({
              type: 'MESSAGE',
              event: parsedData,
            });
          } catch (error) {
            console.error('Error parsing JSON chunk:', error);
          }
        }
      }

      this.chatStreamState.next({ type: 'END' });
    } catch (error) {
      this.handleApiError(error, 0);
    }
  }
  private handleApiError(error: unknown, statusCode: number) {
    console.error('Fetch error:', error);
    let errorType: ChatEventErrorType = 'general';

    this.chatStreamState.next({
      type: 'ERROR',
      error: {
        type: errorType,
        message: (error as Error).toString(),
        statusCode,
      },
    });
  }
}
