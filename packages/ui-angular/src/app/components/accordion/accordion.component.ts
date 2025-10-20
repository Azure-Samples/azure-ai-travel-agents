import { Component, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBrain, lucideCheck, lucideChevronDown } from '@ng-icons/lucide';
import { HlmAccordionImports } from '@spartan-ng/helm/accordion';
import { HlmIconImports } from '@spartan-ng/helm/icon';

@Component({
	selector: 'accordion-preview',
	standalone: true,
	imports: [
		HlmAccordionImports,
    HlmIconImports,
    NgIcon,
	],
	viewProviders: [provideIcons({ lucideChevronDown, lucideCheck, lucideBrain })],
	template: `
		<div hlmAccordion class="w-full scroll-m-0">
			<h6 hlmAccordionItem class="max-h-[300px] !border-b-0" [isOpened]="isOpened()">
        <button hlmAccordionTrigger>
					<span class="flex gap-2">
            <ng-icon hlm hlmAlertIcon [name]="icon()" />
            <span>{{ title() }}</span>
          </span>
					<ng-icon name="lucideChevronDown" hlm hlmAccIcon />
				</button>
				<hlm-accordion-content class="overflow-y-scroll">
          <ng-content></ng-content>
        </hlm-accordion-content>
			</h6>
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
  title = input<string>('');
  icon = input<string>('');
}
