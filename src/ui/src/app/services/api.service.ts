import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

export type Tools = {
  search: boolean;
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
  events: ChatEvent[];
  hasError: boolean;
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

  chatStreamState = new BehaviorSubject<Partial<ChatStreamState> | null>(null);

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

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      const CHUNK_END = '\n\n';
      let buffer = '';

      let done = false;
      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;

        if (value) {
          buffer += decoder.decode(value, { stream: true });
          let boundary = buffer.indexOf(CHUNK_END);

          while (boundary !== -1) {
            const chunk = buffer.slice(0, boundary).trim();
            buffer = buffer.slice(boundary + 2);

            try {
              const parsedData = JSON.parse(chunk);
              this.chatStreamState.next({
                events: [parsedData],
              });
            } catch (error) {
              console.error('Error parsing JSON chunk:', error);
            }

            boundary = buffer.indexOf(CHUNK_END);
          }
        }
      }
    } catch (error) {
      this.handleApiError(error, 0);
    }
  }
  private handleApiError(error: unknown, statusCode: number) {
    console.error('Fetch error:', error);

    let errorMessage = 'Failed to connect to the server';
    let errorType: ChatEventErrorType = 'general';
    const state = this.chatStreamState.getValue();
    let errorContent = state?.error?.message || 'Unknown error';

    this.chatStreamState.next({
      ...state,
      hasError: true,
      error: {
        type: errorType,
        message: errorMessage,
        statusCode,
      },
    });
  }
}
