/**
 * 共享包统一导出入口
 *
 * 本模块作为 shared 包的统一导出入口，集中导出所有业务类型定义、
 * 枚举类型、工具函数等，供各应用（admin/merchant/store/distributor）共享使用。
 *
 * 导出模块说明：
 * - enums.ts: 所有枚举类型定义（订单状态、角色等）
 * - inventory.ts: 库存/仓库/采购相关类型
 * - platform.ts: 平台管理员相关类型
 * - merchant-dashboard.ts: 商户仪表盘类型
 * - crm.ts: CRM 客户关系管理类型
 * - ecommerce.ts: 电商订单类型
 * - distributors.ts: 经销商相关类型
 * - distributor-portal.ts: 经销商门户登录类型
 * - queues.ts: BullMQ 队列任务类型
 * - settings.ts: 商户/平台配置类型
 * - store.ts: 商店发布类型
 * - phase-5-distribution.ts: Phase 5 分销类型
 * - phase-5-allocation.ts: Phase 5 配额分配类型
 * - phase-5-fulfillment.ts: Phase 5 履约配送类型
 * - phase-5-funds.ts: Phase 5 资金汇总类型
 * - phase-5-crm.ts: Phase 5 平台 CRM 类型
 * - fund-formulas.ts: 资金计算公式工具
 * - order-list.ts: 订单列表工具类型
 * - i18n/index.js: 国际化消息
 */

export * from './frontend-api.js';
export * from './enums.js';
export * from './inventory.js';
export * from './platform.js';
export * from './merchant-dashboard.js';
export * from './crm.js';
export * from './ecommerce.js';
export * from './distributors.js';
export * from './distributor-portal.js';
export * from './queues.js';
export * from './settings.js';
export * from './store.js';
export * from './phase-5-distribution.js';
export * from './phase-5-allocation.js';
export * from './phase-5-fulfillment.js';
export * from './phase-5-funds.js';
export * from './phase-5-crm.js';
export * from './fund-formulas.js';
export * from './order-list.js';
export * from './i18n/index.js';
