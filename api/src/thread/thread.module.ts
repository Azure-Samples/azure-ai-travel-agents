import { Module } from '@nestjs/common';
import { AzureAIService } from 'src/utils/azureai.service';
import { ThreadController } from './thread.controller';

@Module({
  controllers: [ThreadController],
  providers: [AzureAIService],
})
export class ThreadModule {}
