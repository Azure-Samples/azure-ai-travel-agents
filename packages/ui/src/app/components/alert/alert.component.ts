
import { Component } from '@angular/core';
import {
  HlmAlertDescriptionDirective,
  HlmAlertDirective,
  HlmAlertIconDirective,
  HlmAlertTitleDirective,
} from '@spartan-ng/ui-alert-helm';
import { HlmIconDirective } from '@spartan-ng/ui-icon-helm';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBox } from '@ng-icons/lucide';

@Component({
  selector: 'alert-preview',
  standalone: true,
  imports: [
    HlmAlertDirective,
    HlmAlertDescriptionDirective,
    HlmAlertIconDirective,
    HlmAlertTitleDirective,
    HlmIconDirective,
    NgIcon,
  ],
  providers: [provideIcons({ lucideBox })],
  template: `
    <div hlmAlert>
      <ng-icon hlm hlmAlertIcon name="lucideBox" />
      <h4 hlmAlertTitle>Thinking...</h4>
      <p hlmAlertDesc>
        <ng-content></ng-content>
      </p>
    </div>
  `,
})
export class AlertComponent {}
