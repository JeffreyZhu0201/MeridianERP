import type { DiagnosisDomain } from '@meridian/shared';

export interface ToolResult {
  found: boolean;
  summary: string;
  data: unknown;
}

export abstract class DiagnosisTool {
  abstract readonly domain: DiagnosisDomain;
  abstract readonly name: string;

  abstract execute(args: Record<string, unknown>): Promise<ToolResult>;

  protected notFound(identifier: string): ToolResult {
    return {
      found: false,
      summary: `未查询到相关记录（${identifier}）`,
      data: null,
    };
  }
}
