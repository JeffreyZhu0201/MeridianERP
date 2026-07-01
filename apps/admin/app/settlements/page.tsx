/**
 * 结算管理页面
 *
 * 功能说明:
 * - 展示平台佣金结算批次列表
 * - 显示应计佣金账本明细
 * - 支持创建新的结算批次
 * - 统计累计应计佣金总额
 *
 * 使用场景:
 * - 平台财务人员管理佣金结算流程
 * - 查看待结算的佣金账本条目
 * - 创建结算批次向经销商打款
 *
 * 数据来源:
 * - 结算批次列表: /platform/settlements API
 * - 佣金账本: /platform/settlements/ledger?status=ACCRUED API
 * - 使用 admin.settlements i18n 命名空间
 *
 * 业务概念:
 * 1. SettlementBatch（结算批次）
 *    - 将多个佣金条目打包成一个批次进行结算
 *    - 批次有状态：PENDING（待处理）、PROCESSING（处理中）、COMPLETED（已完成）
 *
 * 2. CommissionLedgerEntry（佣金账本条目）
 *    - 每笔订单产生的佣金明细记录
 *    - 状态: ACCRUED（应计）、SETTLED（已结算）、VOID（已作废）
 *
 * 结算流程:
 * 1. 订单完成后产生 ACCRUED 状态的佣金条目
 * 2. 财务人员创建结算批次，将多个 ACCRUED 条目打包
 * 3. 批次处理完成后，佣金状态变为 SETTLED
 * 4. 经销商可以申请提现已结算的佣金
 */
import { getLocale, getTranslations } from 'next-intl/server';
import { BentoListHeader, ListPageFrame } from '@meridian/ui';

import { AdminShellWrapper } from '@/components/admin-shell-wrapper';
import {
  apiFetch,
  type CommissionLedgerEntry,
  type PaginatedResponse,
  type SettlementBatch,
} from '@/lib/api';
import { getToken } from '@/lib/auth';
import { SettlementsView } from './_components/settlements-view';

/**
 * 结算管理页面主组件
 *
 * 页面布局:
 * - AdminShellWrapper: 管理门户框架
 * - BentoListHeader: 顶部指标卡片
 * - ListPageFrame: 列表页面框架
 *
 * 核心功能:
 * 1. 数据并行加载
 *    - batchesRes: 结算批次列表（分页）
 *    - ledgerRes: 应计佣金账本条目（筛选 status=ACCRUED）
 *
 * 2. 指标卡片
 *    - settlementBatches: 结算批次总数
 *    - accruedLedger: 应计账本条目数量
 *    - accruedCommissions: 应计佣金总金额
 *
 * 3. SettlementsView 子组件
 *    - 渲染结算批次表格
 *    - 渲染佣金账本条目
 *    - 提供创建批次等操作入口
 *
 * 计算逻辑:
 * - accruedTotal: 累加所有 ACCRUED 条目的 amount
 */
export default async function SettlementsPage() {
  const token = await getToken();
  if (!token) return null;

  const locale = await getLocale();
  const t = await getTranslations('admin.settlements');

  const formatMoney = (value: number) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(value);

  const [batchesRes, ledgerRes] = await Promise.all([
    apiFetch<PaginatedResponse<SettlementBatch>>('/platform/settlements', {}, token).catch(
      () => ({ data: [], meta: { total: 0, page: 1, limit: 20 } }),
    ),
    apiFetch<PaginatedResponse<CommissionLedgerEntry>>(
      '/platform/settlements/ledger?status=ACCRUED',
      {},
      token,
    ).catch(() => ({ data: [], meta: { total: 0, page: 1, limit: 50 } })),
  ]);

  const accruedTotal = ledgerRes.data.reduce((sum, entry) => sum + Number(entry.amount), 0);

  const metrics = [
    {
      title: t('settlementBatches'),
      value: batchesRes.meta.total,
    },
    {
      title: t('accruedLedger'),
      value: ledgerRes.meta.total,
      description: t('entries', { count: ledgerRes.data.length }),
    },
    {
      title: t('accruedCommissions'),
      value: formatMoney(accruedTotal),
    },
  ];

  return (
    <AdminShellWrapper>
      <div className="space-y-6">
        <BentoListHeader metrics={metrics} />
        <ListPageFrame title={t('title')} description={t('description')}>
          <SettlementsView
            batches={batchesRes.data}
            ledgerEntries={ledgerRes.data}
            token={token}
          />
        </ListPageFrame>
      </div>
    </AdminShellWrapper>
  );
}
