import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideBox,
  lucideCircle,
  lucideGlobe,
  lucideHeadset,
  lucideRefreshCw,
  lucideUser,
} from '@ng-icons/lucide';
import {
  BrnAlertDialogContentDirective,
  BrnAlertDialogTriggerDirective,
} from '@spartan-ng/brain/alert-dialog';
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
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import {
  HlmCardContentDirective,
  HlmCardFooterDirective,
  HlmCardHeaderDirective,
  HlmCardTitleDirective,
} from '@spartan-ng/ui-card-helm';
import { HlmCheckboxComponent } from '@spartan-ng/ui-checkbox-helm';
import { HlmFormFieldModule } from '@spartan-ng/ui-formfield-helm';
import { HlmIconDirective } from '@spartan-ng/ui-icon-helm';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { HlmLabelDirective } from '@spartan-ng/ui-label-helm';
import { HlmScrollAreaDirective } from '@spartan-ng/ui-scrollarea-helm';
import { HlmSeparatorDirective } from '@spartan-ng/ui-separator-helm';
import { BrnSeparatorComponent } from '@spartan-ng/brain/separator';
import { AccordionPreviewComponent } from '../components/accordion/accordion.component';
import { ChatEvent } from '../services/api.service';
import { ChatService } from './chat-conversation.service';
import { HlmBadgeDirective } from '@spartan-ng/ui-badge-helm';
@Component({
  selector: 'app-chat-conversation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgIcon,
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
    HlmSeparatorDirective,
    BrnSeparatorComponent,
    HlmCheckboxComponent,
    HlmLabelDirective,
    AccordionPreviewComponent,
  ],
  providers: [
    provideIcons({
      lucideGlobe,
      lucideRefreshCw,
      lucideUser,
      lucideHeadset,
      lucideCircle,
      lucideBox,
    }),
  ],
  templateUrl: './chat-conversation.component.html',
  styleUrl: './chat-conversation.component.css',
})
export class ChatConversationComponent implements OnInit {
  agentMessageStream = signal<string>('');
  agentAllEventsStream = signal<ChatEvent[]>([]);

  constructor(public chatService: ChatService) {
    this.chatService.agentMessage.subscribe((message) => {
      this.agentMessageStream.set(message);
    });
    this.chatService.agentEventStream.subscribe((event) => {
      console.log('Event:', event);
      this.agentAllEventsStream.update((events) => {
        if (event) {
          return [...events, event];
        }
        return events;
      });
    });
  }

  ngOnInit() {
    this.resetChat();
  }

  toggleSearch() {
    this.chatService.tools.update((tools) => ({
      ...tools,
      search: !tools.search,
    }));
  }

  cancelReset(ctx: any) {
    ctx.close();
  }

  confirmReset(ctx: any) {
    ctx.close();
    this.resetChat();
  }

  private resetChat() {
    this.chatService.messages.set([]);
    this.chatService.userMessage.set('');
    this.chatService.isLoading.set(false);
  }
}
