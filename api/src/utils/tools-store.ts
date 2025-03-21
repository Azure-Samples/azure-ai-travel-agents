import { Injectable } from '@nestjs/common';

@Injectable()
export class ToolsFactory {
  private static tools: Record<string, Function> = {};

  static registerTool(name: string, fn: Function) {
    ToolsFactory.tools[name] = fn;
  }

  static getTools() {
    return ToolsFactory.tools;
  }
}
