import {
  HttpClient,
  HttpDownloadProgressEvent,
  HttpEvent,
  HttpEventType
} from '@angular/common/http';
import { inject, Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, catchError, distinct, filter, startWith, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';

export type ServerID =
  | 'echo-ping'
  | 'customer-query'
  | 'itinerary-planning'
  | 'destination-recommendation';

export type Tools = {
  id: ServerID;
  name: string;
  url: string;
  reachable: boolean;
  tools: object[];
  selected: boolean;
};

// Interface for SSE event types
export interface ChatEvent {
  type: 'metadata' | 'error' | 'end';
  agent?: string;
  event?: string | { [key: string]: any };
  data?: any;
  message?: string;
  statusCode?: number;
  agentName?: string;
  kind?: string;
}

export type ChatEventErrorType = 'client' | 'server' | 'general' | undefined;
export interface ChatStreamState {
  id?: number;
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
  reasoning: {
    content: string;
  }[];
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  ngZone = inject(NgZone);
  private readonly http = inject(HttpClient);
  private apiUrl = environment.apiServerUrl;
  chatStreamState = new BehaviorSubject<Partial<ChatStreamState>>({});

 // Track both position and incomplete JSON
  private lastProcessedIndex = 0;
  private incompleteJsonBuffer = '';

  async fetchAvailableTools(): Promise<{ tools: Tools[] } | void> {
    try {
      const response = await fetch(`${this.apiUrl}/api/tools`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const { error } = await response.json();
        return this.handleApiError(
          new Error(error || 'An error occurred while fetching tools'),
          response.status
        );
      }
      return await response.json();
    } catch (error) {
      return this.handleApiError(error, 0);
    }
  }

  stream(message: string, tools: Tools[]) {
    // Reset trackers for each new stream
    this.lastProcessedIndex = 0;
    this.incompleteJsonBuffer = '';

    return this.http
      .post(
        `${this.apiUrl}/api/chat`,
        { message, tools },
        {
          responseType: 'text',
          observe: 'events',
          reportProgress: true,
        }
      )
      .pipe(
        filter(
          (event: HttpEvent<string>): boolean =>
            event.type === HttpEventType.DownloadProgress ||
            event.type === HttpEventType.Response
        ),
        switchMap((event: HttpEvent<string>): any => {
          // NOTE: partialText is cumulative! it contains all the data received so far, not just the new chunk.
          // We need to track what we've already processed and only handle the new data.
          const fullText = (event as HttpDownloadProgressEvent).partialText! || '';

          // Extract only the NEW data
          const newData = fullText.substring(this.lastProcessedIndex);
          this.lastProcessedIndex = fullText.length;

          if (!newData.trim()) {
            return [];
          }

          // Combine with any incomplete JSON from previous chunk
          const dataToProcess = this.incompleteJsonBuffer + newData;

          // Split by double newlines
          const parts = dataToProcess.split(/\n\n+/);

          // The last part might be incomplete, save it for next time
          // (unless this is the final Response event)
          if (event.type !== HttpEventType.Response) {
            this.incompleteJsonBuffer = parts.pop() || '';
          } else {
            this.incompleteJsonBuffer = '';
          }

          return parts.map((jsonValue: string) => {
            try {
              const parsedData = JSON.parse(
                jsonValue.replace(/data:\s+/, '').trim()
              );
              return {
                type: event.type === HttpEventType.Response ? 'END' : 'MESSAGE',
                event: parsedData,
                id: Date.now(),
              };
            } catch (error) {
              this.handleApiError(error, 0);
              return null;
            }
          });
        }),
        distinct(),
        catchError((error) => {
          this.handleApiError(error, 0);
          throw error;
        }),
        filter((state) => state !== null),
        startWith<any>({ type: 'START', id: Date.now() }),
      );
  }

  private handleApiError(error: unknown, statusCode: number) {
    console.error('Fetch error:', error);
    let errorType: ChatEventErrorType = 'general';

    this.chatStreamState.next({
      id: Date.now(),
      type: 'ERROR',
      error: {
        type: errorType,
        message: (error as Error).toString(),
        statusCode,
      },
    });
  }
}
