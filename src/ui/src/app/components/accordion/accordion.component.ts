import { Component, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBrain, lucideChevronDown } from '@ng-icons/lucide';
import {
  HlmAccordionContentComponent,
  HlmAccordionDirective,
  HlmAccordionIconDirective,
  HlmAccordionItemDirective,
  HlmAccordionTriggerDirective,
} from '@spartan-ng/ui-accordion-helm';
import { HlmIconDirective } from '@spartan-ng/ui-icon-helm';

@Component({
	selector: 'accordion-preview',
	standalone: true,
	imports: [
		HlmAccordionDirective,
		HlmAccordionItemDirective,
		HlmAccordionTriggerDirective,
		HlmAccordionContentComponent,
		HlmAccordionIconDirective,
		HlmIconDirective,
    NgIcon,
	],
	viewProviders: [provideIcons({ lucideChevronDown, lucideBrain })],
	template: `
		<div hlmAccordion class="w-full">
			<div hlmAccordionItem class="max-h-[300px] !border-b-0" [isOpened]="isOpened()">
        <button hlmAccordionTrigger class>
					<span class="flex gap-2">
            <ng-icon hlm hlmAlertIcon name="lucideBrain" />
            <span>Agents Thought Process</span>
          </span>
					<ng-icon name="lucideChevronDown" hlm hlmAccIcon />
				</button>
				<hlm-accordion-content class="overflow-y-scroll">
          <ng-content></ng-content>
        </hlm-accordion-content>
			</div>
		</div>
	`,
  styles: [
    `
      hlm-accordion-content[data-state='open'] {
        display: block;
      }
    `,
  ]
})
export class AccordionPreviewComponent {
  isOpened = input<boolean>(false);
}
