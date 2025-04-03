import { AsyncPipe, CommonModule, JsonPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  viewChild,
  viewChildren
} from '@angular/core';
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
import { HlmCheckboxComponent } from '@spartan-ng/ui-checkbox-helm';
import { HlmFormFieldModule } from '@spartan-ng/ui-formfield-helm';
import { HlmIconDirective } from '@spartan-ng/ui-icon-helm';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { HlmLabelDirective } from '@spartan-ng/ui-label-helm';
import { HlmScrollAreaDirective } from '@spartan-ng/ui-scrollarea-helm';
import { HlmSeparatorDirective } from '@spartan-ng/ui-separator-helm';
import { MarkdownComponent, provideMarkdown } from 'ngx-markdown';
import { AccordionPreviewComponent } from '../components/accordion/accordion.component';
import { SkeletonPreviewComponent } from '../components/skeleton-preview/skeleton-preview.component';
import { ChatService } from './chat-conversation.service';
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
    SkeletonPreviewComponent,
    MarkdownComponent,
  ],
  providers: [
    provideMarkdown(),
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatConversationComponent implements OnInit {
  // agentAllEventsStream = signal<ChatEvent[]>([]);
  eot = viewChild<ElementRef<HTMLElement>>('eot');
  agentMessages = viewChildren<ElementRef<HTMLElement>>('agentMessages');

  constructor(
    public chatService: ChatService
  ) {
    this.chatService.messagesStream.subscribe((messages) => {
      if (messages.length === 0) return;
      console.log(this.agentMessages());
      setTimeout(() => {
        // this.agentMessages()?.at(-1)?.nativeElement.scrollIntoView({
        //   behavior: 'smooth',
        // });
        this.eot()?.nativeElement.scrollIntoView({
          behavior: 'smooth',
        });
      }, 0);
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
    this.chatService.resetChat();
  }
}
