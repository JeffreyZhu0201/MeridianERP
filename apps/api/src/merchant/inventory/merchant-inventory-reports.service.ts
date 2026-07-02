import { Injectable } from '@nestjs/common';
import { AdjustmentListQueryDto } from './dto/inventory.dto';
import {
  buildAdjustmentsCsv,
  buildStockCsv,
} from './merchant-inventory-report-csv';
import { MerchantStockService } from './merchant-stock.service';

@Injectable()
export class MerchantInventoryReportsService {
  constructor(private readonly stock: MerchantStockService) {}

  stockReport(tenantId: string) {
    return this.stock.listStockLevels(tenantId, { page: 1, limit: 1000 });
  }

  adjustmentsReport(tenantId: string, query: AdjustmentListQueryDto) {
    return this.stock.listAdjustments(tenantId, {
      ...query,
      page: query.page ?? 1,
      limit: query.limit ?? 1000,
    });
  }

  async stockReportCsv(tenantId: string) {
    const { data } = await this.stock.listStockLevels(tenantId, {
      page: 1,
      limit: 10000,
    });
    return buildStockCsv(data);
  }

  async adjustmentsReportCsv(tenantId: string, query: AdjustmentListQueryDto) {
    const { data } = await this.stock.listAdjustments(tenantId, {
      ...query,
      page: 1,
      limit: 10000,
    });
    return buildAdjustmentsCsv(data);
  }
}
