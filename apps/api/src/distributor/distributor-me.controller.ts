import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DistributorAuthGuard } from '../auth/guards/distributor-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { CommissionListQueryDto } from '../merchant/commissions/dto/commission-list-query.dto';
import { DistributorMeService } from './distributor-me.service';

/**
 * 渠道经销商个人中心控制器
 *
 * 该控制器提供经销商个人相关的 API 端点，包括：
 * - 仪表盘数据获取
 * - 分店列表查询
 * - 提现记录查询与创建
 * - 佣金明细查询
 *
 * 所有端点均受 DistributorAuthGuard 保护，需要有效的经销商 JWT Token。
 * 当前用户信息通过 @CurrentUser() 装饰器注入。
 */
@Controller('distributor/me')
@UseGuards(DistributorAuthGuard)
export class DistributorMeController {
  constructor(private readonly meService: DistributorMeService) {}

  /**
   * 获取经销商仪表盘数据
   *
   * 返回经销商的核心业务指标，包括：
   * - 分店数量
   * - 归因订单统计
   * - 佣金汇总
   * - 可用余额
   * - 订单趋势
   *
   * @param user - 当前认证用户（自动注入）
   * @returns 仪表盘数据对象
   */
  @Get('dashboard')
  getDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.meService.getDashboard(user);
  }

  /**
   * 获取我招募的分店列表
   *
   * 返回该经销商招募的所有分店及其最近 30 天销售业绩。
   *
   * @param user - 当前认证用户（自动注入）
   * @returns 分店列表，每项包含基本信息和销售业绩
   */
  @Get('branches')
  listBranches(@CurrentUser() user: AuthenticatedUser) {
    return this.meService.listBranches(user);
  }

  /**
   * 获取我的提现记录列表
   *
   * 返回当前经销商的所有提现请求记录，按创建时间倒序排列。
   *
   * @param user - 当前认证用户（自动注入）
   * @returns 提现请求记录列表
   */
  @Get('withdrawals')
  listWithdrawals(@CurrentUser() user: AuthenticatedUser) {
    return this.meService.listWithdrawals(user);
  }

  /**
   * 创建新的提现请求
   *
   * 发起一笔新的提现请求。
   * 请求体应包含提现金额（必填）和备注（可选）。
   *
   * @param user - 当前认证用户（自动注入）
   * @param dto - 请求体，包含 amount（提现金额）和 note（备注）
   * @returns 创建的提现请求记录
   */
  @Post('withdrawals')
  @HttpCode(201)
  createWithdrawal(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: { amount: number; note?: string },
  ) {
    return this.meService.createWithdrawal(user, dto.amount, dto.note);
  }

  /**
   * 获取我的佣金明细列表
   *
   * 分页查询当前经销商的佣金账本记录，支持日期范围筛选和状态筛选。
   *
   * @param user - 当前认证用户（自动注入）
   * @param query - 查询参数，参见 CommissionListQueryDto
   * @returns 分页后的佣金记录列表
   */
  @Get('commissions')
  listCommissions(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: CommissionListQueryDto,
  ) {
    return this.meService.listCommissions(user, query);
  }
}
