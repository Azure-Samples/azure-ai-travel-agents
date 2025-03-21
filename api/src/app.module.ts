import { Module } from '@nestjs/common';
import { AgentModule } from './agent/agent.module';
import { ThreadModule } from './thread/thread.module';
import { ToolsFactory } from './utils/tools-store';
import { AzureAIService } from './utils/azureai.service';

@Module({
  imports: [AgentModule, ThreadModule],
  providers: [AzureAIService, ToolsFactory],
})
export class AppModule {}
