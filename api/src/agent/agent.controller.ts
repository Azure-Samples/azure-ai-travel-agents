import { CreateAgentOptionalParams } from '@azure/ai-projects';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Res,
  StreamableFile
} from '@nestjs/common';
import { Response } from 'express';
import { AzureAIService } from 'src/utils/azureai.service';
import { Readable } from 'stream';

@Controller('agents')
export class AgentController {
  constructor(private readonly ai: AzureAIService) {}

  @Get()
  async listAssistants() {
    return await this.ai.listAgents();
  }

  @Get(':agentId')
  async getAssistant(@Param('agentId') agentId: string) {
    return await this.ai.retrieveAgent(agentId);
  }

  @Post()
  async createAssistant(@Body() agent: CreateAgentOptionalParams) {
    return await this.ai.createAgent("agent", agent);
  }

  @Put(':agentId')
  async updateAssistant(
    @Param('agentId') agentId: string,
    @Body() assistant: any
  ) {
    return await this.ai.updateAgent(agentId, assistant);
  }

  @Delete(':agentId')
  async deleteAssistant(@Param('agentId') agentId: string) {
    return await this.ai.deleteAgent(agentId);
  }

  @Post(':agentId/:threadId')
  async postUserQuery(
    @Param('agentId') agentId: string,
    @Param('threadId') threadId: string,
    @Body() content: { role: 'user' | 'assistant'; content: string },
    @Res({ passthrough: true }) response: Response
  ) {
    try {
      response.setHeader('Content-Type', 'text/event-stream');
      response.setHeader('Cache-Control', 'no-cache');
      response.setHeader('Connection', 'keep-alive');

      const stream = this.ai.postQueryAndStreamResponse(
        agentId,
        threadId,
        content
      );

      const readable = Readable.from(stream);
      return new StreamableFile(readable);
    } catch (error) {
      return {
        status: 500,
        message: error.message
      };
    }
  }

  @Post(':agentId/:threadId/title')
  async generateThreadTitle(
    @Param('agentId') agentId: string,
    @Param('threadId') threadId: string,
    @Body() content: { user: string, assistant: string }
  ) {
    const { user, assistant } = content;
    console.log({ user, assistant });

    return {
      title: await this.ai.generateThreadTitle(user, assistant)
    };
  }
}
