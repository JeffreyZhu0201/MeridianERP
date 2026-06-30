# AI 诊断助手 — 平台运营诊断报告 Agent

**日期**: 2026/06/30
**状态**: 已批准
**负责人**: MeridianERP 开发团队

---

## 1. 背景与目标

平台运营人员在日常运维中经常需要追踪业务异常：
- "这个订单为什么没算佣金？"
- "这个商户的资金台账是怎么组成的？"
- "为什么这个补货请求还没审批？"

现有方式是人工查数据库或让开发帮忙查代码，效率低且容易出错。

**目标**：在 Admin 后台嵌入一个 AI 诊断入口，运营输入自然语言查询，AI 自动追踪代码路径，综合多个业务域（订单、佣金、库存、资金）的数据，输出结构化诊断报告。

**用户**：平台运营人员（Admin 门户）

---

## 2. 整体架构

### 2.1 HTTP 接口

```
POST /platform/ai/diagnosis
Content-Type: application/json
Authorization: Bearer <platform-jwt>

Body:
{
  "query": "PLT-20240630-001 为什么没有计算佣金？"
}

Response: DiagnosisResult（见 §6）
```

### 2.2 诊断流程

```
运营输入查询
    ↓
DiagnosisController → DiagnosisService
    ↓
构建 Prompt（system prompt + user query + tools manifest）
    ↓
LLM Client 调用外部 API（OpenAI GPT-4o / Anthropic Claude）
    ↓
Agent 返回 tool_calls 或最终文本
    ↓
执行 Tool（并行，最多 3 轮）
    ↓
Agent 综合 Tool 结果 → 生成最终报告
    ↓
DiagnosisResult 响应 → Admin 前端渲染卡片+报告
```

### 2.3 模块位置

```
apps/api/src/
├── ai/
│   ├── ai.module.ts
│   ├── diagnosis/
│   │   ├── diagnosis.controller.ts
│   │   ├── diagnosis.service.ts
│   │   ├── prompts/
│   │   │   └── diagnosis-system-prompt.ts
│   │   └── tools/
│   │       ├── base.tool.ts
│   │       ├── order.tool.ts
│   │       ├── commission.tool.ts
│   │       ├── inventory.tool.ts
│   │       └── fund.tool.ts
│   └── llm/
│       ├── llm-client.interface.ts
│       ├── openai.client.ts
│       └── anthropic.client.ts

packages/shared/src/
└── ai.ts          # DiagnosisResult, DiagnosisCard, Source, LLM 类型
```

---

## 3. LLM Client

### 3.1 接口定义

```typescript
interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
}

interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

interface LLMClient {
  complete(
    messages: LLMMessage[],
    functions: LLMFunction[],
  ): Promise<LLMResponse>;

  completeWithTools(
    messages: LLMMessage[],
    functions: LLMFunction[],
    maxRounds?: number,
  ): Promise<{
    text?: string;
    toolCalls?: ToolCall[];
  }>;
}

interface LLMFunction {
  name: string;
  description: string;
  parameters: object; // JSON Schema
}
```

### 3.2 Tool 调用策略

- **最多 3 轮**：防止 Agent 死循环
- **每轮并行执行所有被调用的 Tool**（不等串行）
- **Tool 结果以 `tool` role 消息追加到 prompt**
- Agent 决定何时返回文本（不再调用 Tool）即为最终答案

### 3.3 Provider 实现

| Provider | 模型 | 实现文件 |
|----------|------|----------|
| OpenAI | GPT-4o | `llm/openai.client.ts` |
| Anthropic | Claude Sonnet 4 | `llm/anthropic.client.ts` |

Provider 通过 `LLM_PROVIDER` 环境变量切换（`openai` | `anthropic`）。

---

## 4. Tool 定义

### 4.1 基类

```typescript
abstract class DiagnosisTool {
  abstract domain: 'order' | 'commission' | 'inventory' | 'fund';
  abstract name: string;
  abstract description: string;
  abstract parameterSchema: object; // Zod schema

  abstract execute(args: Record<string, unknown>): Promise<ToolResult>;

  protected buildNotFoundResult(identifier: string): ToolResult {
    return {
      found: false,
      summary: `未查询到相关记录（${identifier}）`,
      data: null,
    };
  }
}

interface ToolResult {
  found: boolean;
  summary: string;     // 一句话，供 Agent 快速判断
  data: unknown;       // 完整数据，供 Agent 综合分析
}
```

### 4.2 Tool 清单

| Tool name | 域 | 输入 | 能力 |
|-----------|---|------|------|
| `order_query` | order | `orderId?: string; tenantId?: string; status?: string` | 返回订单详情+状态+关联商户+金额 |
| `commission_query` | commission | `orderId: string` | 返回佣金台账+金额+状态+关联经销商 |
| `inventory_query` | inventory | `sku?: string; warehouseId?: string` | 返回库存水位+最近变动记录 |
| `fund_query` | fund | `tenantId?: string; startDate?: string; endDate?: string` | 返回资金台账+结算批次+余额组成 |

### 4.3 Tool Manifest

```typescript
// 注册到 LLM 的工具列表（OpenAI function calling 格式）
const TOOL_MANIFEST = TOOLS.map(tool => ({
  type: 'function',
  function: {
    name: tool.name,
    description: tool.description,
    parameters: tool.parameterSchema,
  },
}));
```

---

## 5. System Prompt

```text
你是 MeridianERP 平台诊断助手，为运营人员提供正式的业务诊断报告。

【输出规范】
- 语言：简体中文
- 语气：正式报告风格，像专业审计报告
- 称呼用户为"该商户/该订单/该经销商"，不使用"你"
- 结论先行，再给分析依据

【诊断对象】
- 订单（order_query）：追踪状态、金额、履约情况、关联商户
- 佣金（commission_query）：追踪台账、计算过程、结算状态、关联经销商
- 库存（inventory_query）：追踪水位、变动记录、关联商品/仓库
- 资金（fund_query）：追踪台账、结算批次、余额组成

【Tool 调用策略】
- 优先并行调用多个不相关的 Tool，一次获取足够信息
- 避免串行调用，除非后一步依赖前一步结果
- 每次 Tool 调用必须附带中文 reasoning（1-2句），说明为什么调用这个 Tool

【报告结构】
第一步：根据 Tool 结果，判断业务状态（正常/异常/需关注）
第二步：逐项列明分析依据
第三步：给出结论和建议（如有）

【禁止事项】
- 不臆测数据，所有结论必须来自 Tool 返回
- 不生成不存在的订单号/金额
- 不向用户解释内部实现细节（如 Prisma、数据库结构）
```

---

## 6. 输出格式

### 6.1 Shared 类型（`packages/shared/src/ai.ts`）

```typescript
export interface DiagnosisResult {
  report: string;          // 自然语言报告（正式、结论先行）
  cards: DiagnosisCard[];  // 结构化卡片
  sources: Source[];        // 引用来源
}

export interface DiagnosisCard {
  domain: 'order' | 'commission' | 'inventory' | 'fund';
  title: string;                        // 如 "订单状态"
  status: 'normal' | 'warning' | 'error';
  value: string;                        // 一句话结论
  detail?: Record<string, unknown>;      // 详细数据（前端展开显示）
}

export interface Source {
  domain: string;
  ref: string;          // 如 "Order: PLT-xxx"
  description: string; // 如 "订单信息"
}
```

### 6.2 Card 状态语义

| Status | 触发条件 | 颜色 |
|--------|----------|------|
| `normal` | 业务状态符合预期 | 绿色 |
| `warning` | 状态异常但有合理解释 | 黄色 |
| `error` | 业务状态不符合预期，需处理 | 红色 |

### 6.3 前端渲染示意

```
┌─────────────────────────────────────────────────────────┐
│ 诊断报告 — PLT-20240630-001                            │
├──────────┬──────────────────────────────────────────────┤
│ ● 订单   │ 状态：PAID（已支付·未履约）     ⚠ 需关注    │
│ ● 佣金   │ 无台账记录（未触发计算）         ✗ 异常      │
│ ● 资金   │ 资金台账正常，余额 ¥3,200        ✓ 正常      │
│ ● 库存   │ 库存充足，出库记录完整            ✓ 正常      │
└──────────┴──────────────────────────────────────────────┘

【分析结论】
该订单应计佣金 ¥250，基于订单总额 ¥5,000 × 5% 佣金率。
然而台账无记录，原因是订单当前状态为 PAID（已支付但未履约），
佣金仅在 FULFILLED（履约完成）时触发计算。请确认消费者是否已
完成自提，或平台是否已完成配送发货操作。
```

---

## 7. 认证与安全

- 路由挂载在 `/platform/ai/diagnosis`，由 `PlatformAuthGuard` 保护
- 仅平台管理员（admin 角色）可访问
- 每次诊断记录审计日志（query + user + timestamp）
- LLM API Key 存储在环境变量（`OPENAI_API_KEY` / `ANTHROPIC_API_KEY`），不进入代码仓库

---

## 8. 错误处理

| 场景 | 响应 |
|------|------|
| LLM API 超时 | `{ error: "诊断服务暂时不可用，请稍后重试" }` |
| LLM API 报错 | `{ error: "诊断服务异常，请联系管理员" }` |
| Tool 查询无结果 | 返回 `found: false`，Agent 仍可综合其他域给出判断 |
| Tool 执行异常 | 记录日志，返回 `{ found: false, summary: "查询失败" }`，不中断诊断 |

---

## 9. 实施计划

| 阶段 | 内容 |
|------|------|
| **Phase 1** | 基础架构：`ai.module.ts`、`LLMClient` 接口、`DiagnosisService`、Tool 基类 |
| **Phase 2** | 4 个域 Tool 实现（order、commission、inventory、fund） |
| **Phase 3** | OpenAI + Anthropic 双 Provider 支持 |
| **Phase 4** | Admin 前端集成（对话框 + 卡片渲染） |
| **Phase 5** | 审计日志 + 错误处理完善化 |

预计工作量：Phase 1-3 约 2-3 天，前端集成约 1 天。

---

## 10. 评估指标

- **覆盖率**：常见问题类型（佣金异常、资金不明、库存对不上、履约延迟）能否正确诊断
- **准确性**：卡片 status 判断是否与实际业务状态一致
- **延迟**：P95 诊断响应时间 < 10 秒（不含 LLM API 延迟）
- **安全**：无未授权访问，审计日志完整
