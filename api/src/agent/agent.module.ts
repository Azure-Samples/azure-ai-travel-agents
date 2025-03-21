import { Module } from '@nestjs/common';
import { AzureAIService } from 'src/utils/azureai.service';
import { AgentController } from './agent.controller';

@Module({
  controllers: [AgentController],
  providers: [AzureAIService],
})
export class AgentModule {}
