import { CommonModule, JsonPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  HostListener,
  OnInit,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideBot,
  lucideBrain,
  lucideCheck,
  lucideRefreshCw,
  lucideSendHorizontal,
} from '@ng-icons/lucide';
import { BrnAlertDialogImports } from '@spartan-ng/brain/alert-dialog';
import { BrnSelectImports } from '@spartan-ng/brain/select';
import { BrnSeparatorImports } from '@spartan-ng/brain/separator';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmSelectImports } from '@spartan-ng/helm/select';


import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmToasterImports } from '@spartan-ng/helm/sonner';

import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmIcon } from '@spartan-ng/helm/icon';

import { BrnPopoverImports } from '@spartan-ng/brain/popover';
import { HlmFormFieldImports } from '@spartan-ng/helm/form-field';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { HlmPopoverImports } from '@spartan-ng/helm/popover';



import { HlmScrollAreaImports } from '@spartan-ng/helm/scroll-area';
import { HlmSeparatorImports } from '@spartan-ng/helm/separator';
import { HlmSwitch } from '@spartan-ng/helm/switch';
import { AccordionPreviewComponent } from '../components/accordion/accordion.component';
import { SkeletonPreviewComponent } from '../components/skeleton-preview/skeleton-preview.component';
import { ApiService, ChatEvent, ChatMessage } from '../services/api.service';
import { ChatService } from './chat-conversation.service';

const SAMPLE_PROMPT_1 = `Hello! I'm planning a trip to Iceland and would like your expertise to create a custom itinerary. Please use your destination planning tools and internal resources to suggest a day-by-day plan based on:
	•	Top must-see natural sites (glaciers, waterfalls, geothermal spots, etc.)
	•	Unique local experiences (culture, food, hidden gems)
	•	Efficient travel routes and realistic timing
	•	A mix of adventure and relaxation

I'm aiming for an itinerary that balances scenic exploration with comfort. Feel free to tailor recommendations based on the best time to visit and local logistics. Thank you!`;

const SAMPLE_PROMPT_2 = `Hi there! I'd love help planning a trip to Iceland. I'm looking for destination suggestions and a full itinerary tailored to an unforgettable experience. Please use your planning tools and destination insights to recommend:
	•	Where to go and why
	•	What to do each day (including any unique or off-the-beaten-path experiences)
	•	Best ways to get around and where to stay

I'm open to all kinds of adventures—whether it's chasing waterfalls, soaking in hot springs, or discovering small Icelandic towns. A mcp-informed, creative itinerary would be amazing!`;

const SAMPLE_PROMPT_3 = `I'm planning a trip to Morocco and would appreciate a complete, mcp-assisted itinerary.
Please use your travel planning systems to recommend key destinations, daily activities, and a logical route.
I'm looking for a balanced experience that includes cultural landmarks, natural scenery, and time to relax.
Efficient travel logistics and seasonal considerations would be great to include.

Travel Dates: as soon as possible.
Starting Point: from Paris, France.
Duration: 10 days.
Budget: 5000 euros.`;

@Component({
  selector: 'app-chat-conversation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgIcon,
    JsonPipe,
    HlmButtonImports,
    HlmInputImports,
    HlmFormFieldImports,
    HlmCardImports,
    HlmScrollAreaImports,
    HlmIcon,
    HlmBadgeImports,
    HlmPopoverImports,
    BrnPopoverImports,
    HlmAlertImports,
    BrnAlertDialogImports,
    HlmAlertDialogImports,
    HlmToasterImports,
    HlmSeparatorImports,
    BrnSeparatorImports,
    HlmLabelImports,
    HlmSwitch,
    AccordionPreviewComponent,
    SkeletonPreviewComponent,
    BrnSelectImports,
    HlmSelectImports,
  ],
  providers: [
    provideIcons({
      lucideBrain,
      lucideBot,
      lucideSendHorizontal,
      lucideRefreshCw,
      lucideCheck,
    }),
  ],
  templateUrl: './chat-conversation.component.html',
  styleUrl: './chat-conversation.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatConversationComponent implements OnInit {
  agents = signal<{}>({});
  availableApiUrls = signal<{ label: string; url: string, isOnline: boolean }[]>([]);
  eot = viewChild<ElementRef<HTMLElement>>('eot');
  agentMessages = viewChildren<ElementRef<HTMLElement>>('agentMessages');
  samplePrompts = [SAMPLE_PROMPT_1, SAMPLE_PROMPT_2, SAMPLE_PROMPT_3];

  messages: ChatMessage[] = [];
  selectedApiUrl = signal<string>('');

  selectedApiUrlChange = effect(() => {
    this.chatService.setApiUrl(this.selectedApiUrl());
  });

  constructor(public chatService: ChatService) {
    this.chatService.messagesStream.subscribe((messages) => {
      this.messages = messages;
      if (messages.length === 0) return;
      setTimeout(() => {
        this.scrollToBottom();
      }, 0);
    });
  }

  async ngOnInit() {
    this.resetChat();
    this.availableApiUrls.set(await this.chatService.fetchAvailableApiUrls());
    this.selectedApiUrl.set(this.availableApiUrls().find(api => api.isOnline)?.url || this.availableApiUrls()[0]?.url || '');
    await this.chatService.fetchAvailableTools();
  }

  @HostListener('window:keyup.shift.enter', ['$event'])
  sendMessage(event: any) {
    event.preventDefault();
    this.chatService.sendMessage(event);
  }


  onApiUrlChange(url: string) {
    this.selectedApiUrl.set(url);
    this.chatService.setApiUrl(url);
  }

  printAgentsGraph(evt: ChatEvent) {
    const tools =
      evt.data.output?.update?.messages.at(1)?.kwargs?.response_metadata?.tools;
    if (tools) {
      return ' → ' + tools.map((t: any) => t.name).join(' → ');
    }
    return '';
  }

  scrollToBottom() {
    this.eot()?.nativeElement.scrollIntoView({
      behavior: 'auto',
    });
  }

  toggleTool() {}

  cancelReset(ctx: any) {
    ctx.close();
  }

  confirmReset(ctx: any) {
    ctx.close();
    this.resetChat();
  }

  private resetChat() {
    this.chatService.resetChat();
  }
}
