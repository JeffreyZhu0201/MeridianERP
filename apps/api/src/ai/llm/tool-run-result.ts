import type { DiagnosisDomain } from '@meridian/shared';
import type { ToolResult } from '../diagnosis/tools/base.tool';

export interface ToolRunResult {
  domain: DiagnosisDomain;
  title: string;
  result: ToolResult;
}
