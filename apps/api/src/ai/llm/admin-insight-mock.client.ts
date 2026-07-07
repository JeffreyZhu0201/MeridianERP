import { Injectable } from '@nestjs/common';
import type { AdminAiInsight } from '@meridian/shared';
import type { AdminInsightContext } from './admin-insight.types';

@Injectable()
export class AdminInsightMockClient {
  suggest(context: AdminInsightContext): AdminAiInsight {
    switch (context.scene) {
      case 'withdrawal':
        return this.withdrawalInsight(context.data);
      case 'delivery-order':
        return this.deliveryOrderInsight(context.data);
      case 'funds':
        return this.fundsInsight(context.data);
      default:
        return {
          summary: '暂无可用解释。',
          findings: [],
          recommendations: [],
          sources: [],
        };
    }
  }

  private withdrawalInsight(data: Record<string, unknown>): AdminAiInsight {
    const amount = String(data.requestedAmount ?? '0');
    const available = String(data.availableBalance ?? '0');
    const distributorName = String(data.distributorName ?? '拓店员');
    const status = String(data.status ?? 'PENDING');
    const pendingCount = Number(data.pendingWithdrawalCount ?? 0);

    const risks: string[] = [];
    if (Number(available) < Number(amount)) {
      risks.push('申请金额超过当前可用佣金余额');
    }
    if (pendingCount > 1) {
      risks.push('该拓店员存在多笔待审提现');
    }

    return {
      summary: `${distributorName} 申请提现 ${amount} CNY，当前可用余额约 ${available} CNY，状态 ${status}。`,
      findings: [
        `已结算佣金余额（扣除已批准与待审）约 ${available} CNY`,
        `本笔申请金额 ${amount} CNY`,
        data.note ? `申请备注：${String(data.note)}` : '无申请备注',
      ],
      recommendations: [
        '核对拓店员近期配货确认产生的佣金台账',
        '确认无重复待审提现后批准',
        '批准后 mock 打款将写入 payoutReference',
      ],
      risks: risks.length > 0 ? risks : undefined,
      sources: [
        { type: 'withdrawal', ref: String(data.withdrawalId ?? '') },
        { type: 'distributor', ref: distributorName },
        { type: 'balance', ref: `available=${available}` },
      ],
    };
  }

  private deliveryOrderInsight(data: Record<string, unknown>): AdminAiInsight {
    const status = String(data.status ?? '');
    const fulfillmentType = String(data.fulfillmentType ?? '');
    const total = String(data.total ?? '0');
    const tenantSlug = String(data.tenantSlug ?? '');
    const canShip = status === 'PAID' && fulfillmentType === 'DELIVERY';

    const risks: string[] = [];
    if (!canShip && status !== 'FULFILLED') {
      risks.push(`订单状态 ${status}，当前不可发货`);
    }

    return {
      summary: `旗舰配送订单 ${String(data.orderId ?? '').slice(0, 8)}… 状态 ${status}，金额 ${total} CNY。`,
      findings: [
        `履约方式：${fulfillmentType}`,
        `分店：${tenantSlug}`,
        data.guestEmail ? `客户：${String(data.guestEmail)}` : '无客户邮箱',
        canShip ? '订单已支付且为配送单，可执行发货' : '需确认是否满足发货条件',
      ],
      recommendations: canShip
        ? ['核对配送地址与 SKU 行项目', '确认库存后点击发货', '发货后订单状态将变为 FULFILLED']
        : status === 'FULFILLED'
          ? ['订单已完成履约，无需进一步操作']
          : ['等待订单支付或确认履约类型'],
      risks: risks.length > 0 ? risks : undefined,
      sources: [
        { type: 'order', ref: String(data.orderId ?? '') },
        { type: 'tenant', ref: tenantSlug },
      ],
    };
  }

  private fundsInsight(data: Record<string, unknown>): AdminAiInsight {
    const metric = String(data.metric ?? 'net-profit');
    const metricLabels: Record<string, string> = {
      'inventory-cost': '在库总成本（快照）',
      'expected-profit': '预计利润（快照）',
      procurement: '商家进货销售额/利润（期间）',
      commissions: '分销员分润（期间）',
      'net-profit': '净利润（期间）',
    };

    const label = metricLabels[metric] ?? metric;
    const summaryValue = data.summaryValue ?? data.netProfit ?? data.totalCost;

    return {
      summary: `资金指标「${label}」当前值约 ${String(summaryValue ?? '—')}。`,
      findings: [
        data.from && data.to
          ? `统计期间：${String(data.from)} 至 ${String(data.to)}`
          : '该指标为当前库存快照，不受日期筛选影响',
        ...Object.entries(data.breakdown ?? {}).slice(0, 4).map(
          ([key, value]) => `${key}: ${String(value)}`,
        ),
      ],
      recommendations: [
        '结合 PRODUCT.md 区分快照指标与期间指标',
        '异常波动可跳转全局运营诊断进一步追问',
      ],
      sources: [{ type: 'funds', ref: metric }],
    };
  }
}
