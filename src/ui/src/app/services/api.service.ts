import { Injectable } from '@angular/core';
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
  hasError: boolean;
  isStart: boolean;
  isEnd: boolean;
  error: {
    type: ChatEventErrorType;
    message: string;
    statusCode: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
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

      if (!response.body) {
        throw new Error('Readable stream not supported');
      }

      if (!response.ok) {
        const { error } = await response.json();
        this.handleApiError(
          new Error(error || 'An error occurred'),
          response.status
        );
      }

      const decoder = new TextDecoder('utf-8');

      this.chatStreamState.next({ isStart: true });

      for await (const chunk of response.body) {
        const value = decoder.decode(chunk, { stream: true });
        console.log('Received chunk:', value);

        // Split the chunk by double newlines to handle multiple JSON values
        const jsonValues = value.trim().split(/\n\n+/);

        for (const jsonValue of jsonValues) {
          try {
            const parsedData = JSON.parse(jsonValue);
            this.chatStreamState.next({
              event: parsedData,
            });
          } catch (error) {
            console.error('Error parsing JSON chunk:', error);
          }
        }

        this.chatStreamState.next({ isEnd: true });
      }

    } catch (error) {
      this.handleApiError(error, 0);
    }
  }
  private handleApiError(error: unknown, statusCode: number) {
    console.error('Fetch error:', error);

    let errorType: ChatEventErrorType = 'general';
    const state = this.chatStreamState.getValue();
    let errorContent = state?.error?.message || 'Unknown error';

    this.chatStreamState.next({
      ...state,
      hasError: true,
      error: {
        type: errorType,
        message: errorContent,
        statusCode,
      },
    });
  }
}
