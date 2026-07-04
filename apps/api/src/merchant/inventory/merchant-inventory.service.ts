import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import {
  AdjustmentListQueryDto,
  CreatePurchaseOrderDto,
  CreateStockAdjustmentDto,
  PurchaseOrderListQueryDto,
  ReceivePurchaseOrderDto,
  StockLevelListQueryDto,
  UpdateInventorySettingsDto,
  UpdatePurchaseOrderDto,
  UpdateReorderThresholdDto,
} from './dto/inventory.dto';
import { MerchantInventoryReportsService } from './merchant-inventory-reports.service';
import { MerchantPurchaseOrdersService } from './merchant-purchase-orders.service';
import { MerchantStockService } from './merchant-stock.service';
import { MerchantWarehousesService } from './merchant-warehouses.service';

@Injectable()
export class MerchantInventoryService {
  constructor(
    private readonly warehouses: MerchantWarehousesService,
    private readonly stock: MerchantStockService,
    private readonly purchaseOrders: MerchantPurchaseOrdersService,
    private readonly reports: MerchantInventoryReportsService,
  ) {}

  getSettings(tenantId: string) {
    return this.warehouses.getSettings(tenantId);
  }

  updateSettings(user: AuthenticatedUser, dto: UpdateInventorySettingsDto) {
    return this.warehouses.updateSettings(user, dto);
  }

  listStockLevels(tenantId: string, query: StockLevelListQueryDto) {
    return this.stock.listStockLevels(tenantId, query);
  }

  stockLevelsSummary(tenantId: string) {
    return this.stock.stockLevelsSummary(tenantId);
  }

  createAdjustment(user: AuthenticatedUser, dto: CreateStockAdjustmentDto) {
    return this.stock.createAdjustment(user, dto);
  }

  listAdjustments(tenantId: string, query: AdjustmentListQueryDto) {
    return this.stock.listAdjustments(tenantId, query);
  }

  lowStockAlerts(tenantId: string) {
    return this.stock.lowStockAlerts(tenantId);
  }

  updateReorderThreshold(
    user: AuthenticatedUser,
    variantId: string,
    dto: UpdateReorderThresholdDto,
  ) {
    return this.stock.updateReorderThreshold(user, variantId, dto);
  }

  listPurchaseOrders(tenantId: string, query: PurchaseOrderListQueryDto) {
    return this.purchaseOrders.listPurchaseOrders(tenantId, query);
  }

  getPurchaseOrder(tenantId: string, id: string) {
    return this.purchaseOrders.getPurchaseOrder(tenantId, id);
  }

  createPurchaseOrder(user: AuthenticatedUser, dto: CreatePurchaseOrderDto) {
    return this.purchaseOrders.createPurchaseOrder(user, dto);
  }

  updatePurchaseOrder(
    user: AuthenticatedUser,
    id: string,
    dto: UpdatePurchaseOrderDto,
  ) {
    return this.purchaseOrders.updatePurchaseOrder(user, id, dto);
  }

  submitPurchaseOrder(user: AuthenticatedUser, id: string) {
    return this.purchaseOrders.submitPurchaseOrder(user, id);
  }

  cancelPurchaseOrder(user: AuthenticatedUser, id: string) {
    return this.purchaseOrders.cancelPurchaseOrder(user, id);
  }

  receivePurchaseOrder(
    user: AuthenticatedUser,
    id: string,
    dto: ReceivePurchaseOrderDto,
  ) {
    return this.purchaseOrders.receivePurchaseOrder(user, id, dto);
  }

  stockReport(tenantId: string) {
    return this.reports.stockReport(tenantId);
  }

  adjustmentsReport(tenantId: string, query: AdjustmentListQueryDto) {
    return this.reports.adjustmentsReport(tenantId, query);
  }

  stockReportCsv(tenantId: string) {
    return this.reports.stockReportCsv(tenantId);
  }

  adjustmentsReportCsv(tenantId: string, query: AdjustmentListQueryDto) {
    return this.reports.adjustmentsReportCsv(tenantId, query);
  }
}
