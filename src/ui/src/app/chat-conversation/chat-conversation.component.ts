import { AsyncPipe, CommonModule, JsonPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
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
  lucideRefreshCw,
  lucideSendHorizontal,
} from '@ng-icons/lucide';
import {
  BrnAlertDialogContentDirective,
  BrnAlertDialogTriggerDirective,
} from '@spartan-ng/brain/alert-dialog';
import { BrnSeparatorComponent } from '@spartan-ng/brain/separator';
import {
  HlmAlertDialogActionButtonDirective,
  HlmAlertDialogCancelButtonDirective,
  HlmAlertDialogComponent,
  HlmAlertDialogContentComponent,
  HlmAlertDialogDescriptionDirective,
  HlmAlertDialogFooterComponent,
  HlmAlertDialogHeaderComponent,
  HlmAlertDialogTitleDirective,
} from '@spartan-ng/ui-alertdialog-helm';
import { HlmBadgeDirective } from '@spartan-ng/ui-badge-helm';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import {
  HlmCardContentDirective,
  HlmCardFooterDirective,
  HlmCardHeaderDirective,
  HlmCardTitleDirective,
} from '@spartan-ng/ui-card-helm';
import { HlmToasterComponent } from '@spartan-ng/ui-sonner-helm';

import {
  BrnPopoverComponent,
  BrnPopoverContentDirective,
  BrnPopoverTriggerDirective,
} from '@spartan-ng/brain/popover';
import {
  HlmAlertDescriptionDirective,
  HlmAlertDirective,
} from '@spartan-ng/ui-alert-helm';
import { HlmFormFieldModule } from '@spartan-ng/ui-formfield-helm';
import { HlmIconDirective } from '@spartan-ng/ui-icon-helm';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { HlmLabelDirective } from '@spartan-ng/ui-label-helm';
import { HlmPopoverContentDirective } from '@spartan-ng/ui-popover-helm';
import { HlmScrollAreaDirective } from '@spartan-ng/ui-scrollarea-helm';
import { HlmSeparatorDirective } from '@spartan-ng/ui-separator-helm';
import { HlmSwitchComponent } from '@spartan-ng/ui-switch-helm';
import { MarkdownComponent, provideMarkdown } from 'ngx-markdown';
import { AccordionPreviewComponent } from '../components/accordion/accordion.component';
import { SkeletonPreviewComponent } from '../components/skeleton-preview/skeleton-preview.component';
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

I'm open to all kinds of adventures—whether it's chasing waterfalls, soaking in hot springs, or discovering small Icelandic towns. A tool-informed, creative itinerary would be amazing!`;

const SAMPLE_PROMPT_3 = `I'm planning a trip to Morocco and would appreciate a complete, tool-assisted itinerary. Please use your travel planning systems to recommend key destinations, daily activities, and a logical route. I'm looking for a balanced experience that includes cultural landmarks, natural scenery, and time to relax. Efficient travel logistics and seasonal considerations would be great to include.`;

@Component({
  selector: 'app-chat-conversation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgIcon,
    JsonPipe,
    AsyncPipe,
    HlmButtonDirective,
    HlmInputDirective,
    HlmFormFieldModule,
    HlmCardHeaderDirective,
    HlmCardContentDirective,
    HlmCardFooterDirective,
    HlmCardTitleDirective,
    HlmScrollAreaDirective,
    HlmIconDirective,
    HlmBadgeDirective,
    BrnPopoverComponent,
    BrnPopoverTriggerDirective,
    BrnPopoverContentDirective,
    HlmPopoverContentDirective,
    BrnAlertDialogTriggerDirective,
    BrnAlertDialogContentDirective,
    HlmAlertDialogComponent,
    HlmAlertDialogContentComponent,
    HlmAlertDialogHeaderComponent,
    HlmAlertDialogFooterComponent,
    HlmAlertDialogTitleDirective,
    HlmAlertDialogDescriptionDirective,
    HlmAlertDialogActionButtonDirective,
    HlmAlertDialogCancelButtonDirective,
    HlmAlertDirective,
    HlmAlertDescriptionDirective,
    HlmToasterComponent,
    HlmSeparatorDirective,
    BrnSeparatorComponent,
    HlmLabelDirective,
    HlmSwitchComponent,
    AccordionPreviewComponent,
    SkeletonPreviewComponent,
    MarkdownComponent,
  ],
  providers: [
    provideMarkdown(),
    provideIcons({
      lucideBrain,
      lucideBot,
      lucideSendHorizontal,
      lucideRefreshCw,
    }),
  ],
  templateUrl: './chat-conversation.component.html',
  styleUrl: './chat-conversation.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatConversationComponent implements OnInit {
  agents = signal<{}>({});
  eot = viewChild<ElementRef<HTMLElement>>('eot');
  agentMessages = viewChildren<ElementRef<HTMLElement>>('agentMessages');
  samplePrompts = [SAMPLE_PROMPT_1, SAMPLE_PROMPT_2, SAMPLE_PROMPT_3];

  constructor(public chatService: ChatService) {
    this.chatService.messagesStream.subscribe((messages) => {
      if (messages.length === 0) return;
      setTimeout(() => {
        this.scrollToBottom();
      }, 0);
    });
  }

  async ngOnInit() {
    this.resetChat();
    await this.chatService.fetchAvailableTools();
  }

  @HostListener('window:keyup.shift.enter', ['$event'])
  sendMessage(event: any) {
    event.preventDefault();
    this.chatService.sendMessage();
  }

  scrollToBottom() {
    this.eot()?.nativeElement.scrollIntoView({
      behavior: 'smooth',
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
