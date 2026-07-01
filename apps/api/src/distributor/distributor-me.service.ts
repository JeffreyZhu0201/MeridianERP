import { Injectable, NotFoundException } from '@nestjs/common';
import { LedgerStatus, OrderStatus, Prisma } from '@prisma/client';
import { DEFAULT_COMMISSION_WINDOW_DAYS } from '@meridian/shared';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { parseDateRangeQuery } from '../common/date-range';
import { buildOrderTrend } from '../common/dashboard-trend';
import {
  decimalSumToString,
  mapCommissionStatementRow,
} from '../merchant/commissions/commission-mappers';
import { CommissionListQueryDto } from '../merchant/commissions/dto/commission-list-query.dto';
import { PlatformWithdrawalsService } from '../platform/withdrawals/platform-withdrawals.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 渠道经销商个人中心服务
 *
 * 该服务为已登录的渠道经销商提供以下功能：
 * - 获取仪表盘统计数据（分支数量、订单金额、佣金汇总等）
 * - 获取我招募的分店列表及其销售业绩
 * - 获取我的提现记录
 * - 创建新的提现请求
 * - 获取我的佣金明细记录
 *
 * 所有操作均基于当前认证用户（经过 DistributorAuthGuard 验证），
 * 自动过滤只返回属于该经销商的数据。
 */
@Injectable()
export class DistributorMeService {
  /**
   * 构造函数
   *
   * @param prisma - Prisma 数据库服务，用于数据库操作
   * @param withdrawalsService - 平台提现服务，用于处理提现请求和余额查询
   */
  constructor(
    private readonly prisma: PrismaService,
    private readonly withdrawalsService: PlatformWithdrawalsService,
  ) {}

  /**
   * 从认证用户信息中提取经销商ID
   *
   * @param user - 经过 DistributorAuthGuard 验证的认证用户对象
   * @returns 经销商的唯一标识 ID
   */
  private distributorId(user: AuthenticatedUser) {
    return user.userId;
  }

  /**
   * 加载当前认证经销商的完整信息
   *
   * 从数据库查询当前经销商记录，同时验证：
   * - 经销商必须存在
   * - portalEnabled 必须为 true（门户访问已启用）
   * - isActive 必须为 true（账户处于激活状态）
   * - tenantId 必须为 null（平台级经销商，而非商户级）
   *
   * @param user - 当前认证用户
   * @returns 经销商记录
   * @throws NotFoundException 如果经销商不存在或验证失败
   */
  private async loadDistributor(user: AuthenticatedUser) {
    // 查询经销商记录，使用多重条件过滤确保数据安全
    const distributor = await this.prisma.distributor.findFirst({
      where: {
        id: this.distributorId(user),    // 用户ID必须匹配
        portalEnabled: true,            // 门户访问必须已启用
        isActive: true,                 // 账户必须处于激活状态
        tenantId: null,                 // 必须是平台级经销商（tenantId为null）
      },
    });
    if (!distributor) {
      // 经销商不存在或验证条件不满足，抛出 404 异常
      throw new NotFoundException('Distributor not found');
    }
    return distributor;
  }

  /**
   * 生成默认的佣金统计日期范围
   *
   * 默认返回从今天往前推 (DEFAULT_COMMISSION_WINDOW_DAYS - 1) 天
   * 到今天的日期范围。例如如果 DEFAULT_COMMISSION_WINDOW_DAYS 为 30，
   * 则返回最近 29 天的数据范围。
   *
   * @returns 解析后的日期范围对象，包含 from、to 和 ISO 格式字符串
   */
  private defaultRangeQuery() {
    // 设置日期范围的结束时间为今天 23:59:59.999
    const to = new Date();
    // 设置日期范围的开始时间
    const from = new Date(to);
    // 向前推 N-1 天（N 为 DEFAULT_COMMISSION_WINDOW_DAYS）
    from.setUTCDate(from.getUTCDate() - (DEFAULT_COMMISSION_WINDOW_DAYS - 1));
    // 将开始时间设置为当天的 00:00:00.000
    from.setUTCHours(0, 0, 0, 0);
    // 将结束时间设置为当天的 23:59:59.999
    to.setUTCHours(23, 59, 59, 999);
    // 解析为日期范围查询对象
    return parseDateRangeQuery({
      from: from.toISOString().slice(0, 10),  // 格式：YYYY-MM-DD
      to: to.toISOString().slice(0, 10),      // 格式：YYYY-MM-DD
    });
  }

  /**
   * 获取经销商仪表盘统计数据
   *
   * 仪表盘展示经销商的核心业务指标，包括：
   * - 分店数量（我招募的分店总数）
   * - 归因订单数量和营收（指定日期范围内的已支付/已完成订单）
   * - 佣金汇总（应计佣金、已结算佣金、总佣金）
   * - 可用余额（可提现金额）
   * - 订单趋势数据（用于绘制趋势图）
   *
   * 归因订单是指属于该经销商招募的分店的订单。
   *
   * @param user - 当前认证用户
   * @returns 仪表盘数据对象
   */
  async getDashboard(user: AuthenticatedUser) {
    // 加载当前认证经销商的完整信息（验证经销商存在且有效）
    const distributor = await this.loadDistributor(user);
    // 获取默认的佣金统计日期范围（最近 N 天，N 由 DEFAULT_COMMISSION_WINDOW_DAYS 定义）
    const range = this.defaultRangeQuery();
    const distributorId = distributor.id;
    // 构建日期范围过滤条件，用于后续查询
    const boundAtFilter = { gte: range.from, lte: range.to };

    // 获取该经销商招募的所有分店（商户）的 tenantId 列表
    const recruitedTenants = await this.prisma.merchantProfile.findMany({
      where: { recruitedByDistributorId: distributorId },
      select: { tenantId: true },
    });
    // 提取所有分店的 tenantId，用于后续订单查询
    const tenantIds = recruitedTenants.map((m) => m.tenantId);

    // 构建订单查询条件：属于招募分店的已支付/已完成订单
    // 只统计已支付（PAID）和已履行（FULFILLED）状态的订单
    const orderWhere = {
      tenantId: { in: tenantIds },                                // 必须在招募的分店中
      status: { in: [OrderStatus.PAID, OrderStatus.FULFILLED] },  // 订单状态过滤
      createdAt: boundAtFilter,                                   // 日期范围过滤
    };
    // 构建佣金账本查询条件：当前经销商的、非作废的记录
    const ledgerWhere = {
      distributorId,                      // 必须是当前经销商的记录
      createdAt: boundAtFilter,           // 日期范围过滤
      status: { not: LedgerStatus.VOID }, // 排除已作废的记录
    };

    // 并行执行多个聚合查询以提高性能
    // 所有查询都在 Promise.all 中并发执行，减少总体响应时间
    const [
      branchCount,                       // 分店数量（该经销商招募的分店总数）
      orderAgg,                          // 订单聚合（数量和总额）
      commissionAccruedAgg,              // 应计佣金聚合（ACCRUED 状态的佣金总额）
      commissionSettledAgg,              // 已结算佣金聚合（SETTLED 状态的佣金总额）
      entryCount,                        // 佣金条目数量（所有非作废的佣金记录数）
      trendOrders,                       // 用于趋势计算的订单列表
      availableBalance,                  // 可用余额（可提现金额）
    ] = await Promise.all([
      // 统计该经销商招募的分店数量
      this.prisma.merchantProfile.count({
        where: { recruitedByDistributorId: distributorId },
      }),
      // 如果有招募的分店，查询订单聚合；否则返回空结果
      // 使用三元表达式避免在 tenantIds 为空时执行无效查询
      tenantIds.length
        ? this.prisma.order.aggregate({
            where: orderWhere,
            _count: { _all: true },     // 统计订单总数量
            _sum: { total: true },       // 汇总订单总额
          })
        : Promise.resolve({ _count: { _all: 0 }, _sum: { total: null } }),
      // 应计状态（ACCRUED）的佣金总额
      this.prisma.commissionLedger.aggregate({
        where: { ...ledgerWhere, status: LedgerStatus.ACCRUED },
        _sum: { amount: true },
      }),
      // 已结算状态（SETTLED）的佣金总额
      this.prisma.commissionLedger.aggregate({
        where: { ...ledgerWhere, status: LedgerStatus.SETTLED },
        _sum: { amount: true },
      }),
      // 佣金条目总数
      this.prisma.commissionLedger.count({ where: ledgerWhere }),
      // 用于计算趋势的订单详情（按时间聚合）
      // 获取订单的创建时间、总金额，以及关联的佣金条目信息
      // 这些数据将用于构建订单趋势图表
      tenantIds.length
        ? this.prisma.order.findMany({
            where: orderWhere,
            select: {
              createdAt: true,                               // 订单创建时间
              total: true,                                   // 订单总金额
              commissionEntry: { select: { amount: true, status: true } }, // 关联的佣金条目
            },
          })
        : Promise.resolve([]),
      // 获取该经销商的可提现余额
      this.withdrawalsService.getAvailableBalance(distributorId),
    ]);

    // 计算佣金总额 = 应计佣金 + 已结算佣金
    const accruedTotal = decimalSumToString(commissionAccruedAgg._sum.amount);
    const settledTotal = decimalSumToString(commissionSettledAgg._sum.amount);
    const totalCommission = new Prisma.Decimal(accruedTotal)
      .plus(settledTotal)
      .toString();

    return {
      distributorId: distributor.id,                          // 经销商ID
      distributorName: distributor.name,                      // 经销商名称
      branchCount,                                             // 分店数量
      attributedOrderCount: orderAgg._count._all,              // 归因订单数量（指定日期范围内的已支付/已完成订单）
      attributedOrderRevenue: decimalSumToString(orderAgg._sum.total), // 归因订单营收
      availableBalance: availableBalance.toString(),            // 可用余额
      commissionSummary: {
        // 佣金汇总信息
        accruedTotal,           // 应计佣金总额（已产生但尚未结算的佣金）
        settledTotal,           // 已结算佣金总额（已支付给经销商的佣金）
        totalCommission,        // 佣金总额 = 应计 + 已结算
        entryCount,             // 佣金条目数量
        from: range.fromIso,    // 统计起始日期
        to: range.toIso,        // 统计结束日期
      },
      // 订单趋势数据，用于前端绘制趋势图表
      trend: buildOrderTrend(range.from, range.to, trendOrders),
    };
  }

  /**
   * 获取我招募的分店列表及销售业绩
   *
   * 返回该经销商招募的所有分店信息，包括：
   * - 分店基本信息（业务名称、slug、招募时间）
   * - 最近 30 天销售业绩（销售额、订单数量）
   *
   * 销售数据基于已支付和已完成的订单统计。
   *
   * @param user - 当前认证用户
   * @returns 分店列表，每项包含基本信息和销售业绩
   */
  async listBranches(user: AuthenticatedUser) {
    const distributor = await this.loadDistributor(user);

    // 计算 30 天前的日期作为统计起始点
    const windowStart = new Date();
    windowStart.setUTCDate(windowStart.getUTCDate() - 30);

    // 获取该经销商招募的所有分店
    const merchants = await this.prisma.merchantProfile.findMany({
      where: { recruitedByDistributorId: distributor.id },
      include: { tenant: true },
    });

    // 为每个分店并行查询最近 30 天的销售数据
    // 使用 Promise.all 并行处理所有分店的查询，提升响应速度
    return Promise.all(
      merchants.map(async (m) => {
        // 聚合查询：统计该分店最近30天的订单数量和销售额
        const agg = await this.prisma.order.aggregate({
          where: {
            tenantId: m.tenantId,                                  // 该分店的租户ID
            status: { in: [OrderStatus.PAID, OrderStatus.FULFILLED] }, // 只统计已支付和已完成的订单
            createdAt: { gte: windowStart },                        // 创建时间在最近30天内
          },
          _sum: { total: true },   // 汇总订单总额
          _count: { _all: true },  // 统计订单数量
        });
        return {
          tenantId: m.tenantId,                                  // 分店所属租户ID
          merchantProfileId: m.id,                               // 商户档案ID
          businessName: m.businessName,                          // 业务名称
          slug: m.tenant.slug,                                   // 分店slug（用于URL）
          recruitedAt: m.recruitedAt?.toISOString() ?? null,     // 招募时间
          salesLast30Days: Number(agg._sum.total ?? 0),          // 最近30天销售额
          orderCountLast30Days: agg._count._all,                 // 最近30天订单数
        };
      }),
    );
  }

  /**
   * 获取我的提现记录列表
   *
   * 返回当前经销商的所有提现请求记录，按创建时间倒序排列。
   *
   * @param user - 当前认证用户
   * @returns 提现请求记录列表
   */
  async listWithdrawals(user: AuthenticatedUser) {
    // 加载当前认证经销商信息
    const distributor = await this.loadDistributor(user);
    // 查询该经销商的所有提现请求，按创建时间倒序排列
    return this.prisma.withdrawalRequest.findMany({
      where: { distributorId: distributor.id },  // 只返回属于该经销商的记录
      orderBy: { createdAt: 'desc' },             // 按创建时间倒序，最新的在前
    });
  }

  /**
   * 创建新的提现请求
   *
   * 发起一笔新的提现请求。系统会验证：
   * - 提现金额必须为正数
   * - 可用余额必须足够（由 withdrawalsService 验证）
   *
   * @param user - 当前认证用户
   * @param amount - 提现金额
   * @param note - 可选的备注信息
   * @returns 创建的提现请求记录
   */
  async createWithdrawal(
    user: AuthenticatedUser,
    amount: number,
    note?: string,
  ) {
    // 加载当前认证经销商信息
    const distributor = await this.loadDistributor(user);
    // 调用平台提现服务创建提现请求
    // 提现金额和备注由 withdrawalsService 进行业务规则验证
    return this.withdrawalsService.createRequest(distributor.id, amount, note);
  }

  /**
   * 获取我的佣金明细列表
   *
   * 分页查询当前经销商的佣金账本记录，支持：
   * - 按日期范围筛选
   * - 按状态筛选（应计/已结算/已作废）
   * - 分页控制（page、limit）
   *
   * @param user - 当前认证用户
   * @param query - 查询参数，包含日期范围、状态、分页信息
   * @returns 分页后的佣金记录列表，包含总数和分页信息
   */
  async listCommissions(user: AuthenticatedUser, query: CommissionListQueryDto) {
    // 加载当前认证经销商信息
    const distributor = await this.loadDistributor(user);
    // 解析查询参数中的日期范围（支持 from/to 格式）
    const range = parseDateRangeQuery(query);

    // 分页参数处理
    // page：页码，从 1 开始，默认 1
    // limit：每页条数，默认 20，最大 100
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;  // 计算分页偏移量

    // 根据查询参数构建状态过滤条件
    // 如果指定了状态则精确匹配，否则排除已作废的记录
    const statusFilter = query.status
      ? { status: query.status }
      : { status: { not: LedgerStatus.VOID } };

    // 构建完整的查询条件
    const where: Prisma.CommissionLedgerWhereInput = {
      distributorId: distributor.id,
      createdAt: { gte: range.from, lte: range.to },
      ...statusFilter,
    };

    // 并行查询数据列表和总数
    // 使用 Promise.all 并行执行列表查询和总数查询，提高响应速度
    const [rows, total] = await Promise.all([
      this.prisma.commissionLedger.findMany({
        where,
        include: {
          // 关联订单信息（只取总额字段，节省数据传输）
          order: { select: { total: true } },
          // 关联经销商信息（用于显示佣金计算依据）
          distributor: {
            select: {
              id: true,
              name: true,
              commissionType: true,    // 佣金类型（按比例/固定金额）
              commissionRate: true,    // 佣金费率
            },
          },
          // 结算批次信息（如果已结算，显示批次号和结算时间）
          settlementBatch: true,
        },
        orderBy: { createdAt: 'desc' },  // 按创建时间倒序
        skip,                            // 跳过前 N 条（分页偏移量）
        take: limit,                     // 返回最多 N 条记录
      }),
      // 统计符合条件的记录总数，用于分页
      this.prisma.commissionLedger.count({ where }),
    ]);

    return {
      items: rows.map(mapCommissionStatementRow), // 映射后的佣金记录列表
      total,                                      // 总记录数
      page,                                       // 当前页码
      limit,                                      // 每页条数
    };
  }
}
