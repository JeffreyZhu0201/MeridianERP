import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { MerchantAuthGuard } from '../../auth/guards/merchant-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { CommissionsService } from './commissions.service';
import { CommissionListQueryDto } from './dto/commission-list-query.dto';
import { CommissionSummaryQueryDto } from './dto/commission-summary-query.dto';

/**
 * 佣金账本控制器 (CommissionsController)
 *
 * ========================================
 * 模块职责
 * ========================================
 * 本控制器为商户提供佣金账本查询接口，用于：
 * 1. 查看历史佣金记录（订单维度）
 * 2. 汇总统计（累计应计/已结算佣金）
 *
 * ========================================
 * 认证要求
 * ========================================
 * - 所有接口需要 MerchantAuthGuard 保护
 * - 当前用户信息通过 @CurrentUser() 注入
 * - tenantId 从 JWT payload 中提取（merchant 用户必填）
 *
 * ========================================
 * API 端点
 * ========================================
 *
 * GET /merchant/commissions/summary
 * - 功能：获取佣金汇总统计
 * - 参数：dateRange（日期范围）、distributorId（可选）
 * - 返回：{ accruedTotal, settledTotal, totalCommission, entryCount }
 *
 * GET /merchant/commissions
 * - 功能：获取佣金记录分页列表
 * - 参数：page、limit、status、distributorId、dateRange
 * - 返回：{ items[], total, page, limit }
 *
 * ========================================
 * 数据权限说明
 * ========================================
 * - 商户只能查看属于自己的佣金记录（按 tenantId 过滤）
 * - distributorId 筛选可选，用于查看特定经销商带来的佣金
 * - 不显示 VOID（已作废）状态的记录
 *
 * ========================================
 * 业务背景
 * ========================================
 * 商户可通过此接口：
 * - 对账：核对实际到账与系统记录是否一致
 * - 分析：按时间/经销商维度分析佣金收入
 * - 追溯：查看每笔佣金对应的订单详情
 *
 * @see CommissionsService 详细业务逻辑
 * @see CommissionLedger Prisma 模型定义
 */
@Controller('merchant/commissions')
@UseGuards(MerchantAuthGuard)
export class CommissionsController {
  constructor(private readonly commissionsService: CommissionsService) {}

  @Get('summary')
  summary(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: CommissionSummaryQueryDto,
  ) {
    return this.commissionsService.summary(user.tenantId!, query);
  }

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: CommissionListQueryDto,
  ) {
    return this.commissionsService.list(user.tenantId!, query);
  }
}
