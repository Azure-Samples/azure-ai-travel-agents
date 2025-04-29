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

const SAMPLE_PROMPT = `Hello! I am planning a trip to Iceland and would appreciate your help in building a detailed itinerary. I amm especially interested in destination recommendations and a well-structured day-by-day plan. Please use your travel planning tools and destination insights to suggest:
	•	The best regions and towns to visit based on my interests
	•	Top natural attractions (e.g., waterfalls, glaciers, hot springs)
	•	Unique local experiences or hidden gems
	•	A balanced mix of adventure (e.g., hiking, caves) and relaxation (e.g., scenic drives, hot springs, culture)

Feel free to factor in optimal travel routes, local weather patterns, and seasonal highlights. I amm looking for a well-informed, tool-assisted plan to help me make the most of the trip!`;

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

  @HostListener('window:keyup.shift.p', ['$event'])
  insertPrompt(event: any) {
    event.preventDefault();
    this.chatService.userMessage.set(SAMPLE_PROMPT);
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
