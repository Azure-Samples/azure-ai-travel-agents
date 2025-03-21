import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Thread } from 'openai/resources/beta/threads/threads';
import { AzureAIService } from 'src/utils/azureai.service';

@Controller('threads')
export class ThreadController {
  constructor(private readonly ai: AzureAIService) {}

  @Post()
  async createThread() {
    try {
      return await this.ai.createThread();
    } catch (error) {
      return { status: 500, error };
    }
  }

  @Get(':threadId')
  async getThread(@Param('threadId') threadId: string) {
    try {
      return await this.ai.loadThread(threadId);
    } catch (error) {
      return { status: 500, error };
    }
  }

  @Get(':threadId/messages')
  async getThreadMessages(@Param('threadId') threadId: string) {
    try {
      return await this.ai.loadThreadMessages(threadId);
    } catch (error) {
      return { status: 500, error };
    }
  }

  @Delete(':threadId')
  async deleteThread(@Param('threadId') threadId: string) {
    try {
      return await this.ai.deleteThread(threadId);
    } catch (error) {
      return { status: 500, error };
    }
  }

  @Get()
  async listThreads() {
    try {
      return await this.ai.listThreads();
    } catch (error) {
      return { status: 500, error };
    }
  }

  @Patch(':threadId')
  async saveThread(
    @Param('threadId') threadId: string,
    @Body() thread: Partial<Thread>
  ) {
    try {
      return await this.ai.saveThread(threadId, thread);
    } catch (error) {
      return { status: 500, error };
    }
  }

  @Get(':threadId/runs')
  async listRuns(@Param('threadId') threadId: string) {
    try {
      return await this.ai.listRuns(threadId);
    } catch (error) {
      return { status: 500, error };
    }
  }
}
