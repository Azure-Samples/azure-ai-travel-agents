import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChatConversationComponent } from './chat-conversation/chat-conversation.component';
import { ThemeToggleComponent } from './components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ChatConversationComponent, ThemeToggleComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'ai-travel-agents-ui';
}
