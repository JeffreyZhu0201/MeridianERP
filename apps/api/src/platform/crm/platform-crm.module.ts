import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { PlatformCrmCompaniesController } from './platform-crm-companies.controller';
import { PlatformCrmCompaniesService } from './platform-crm-companies.service';
import { PlatformCrmContactsController } from './platform-crm-contacts.controller';
import { PlatformCrmContactsService } from './platform-crm-contacts.service';
import { PlatformCrmLeadsController } from './platform-crm-leads.controller';
import { PlatformCrmLeadsService } from './platform-crm-leads.service';

/**
 * 平台 CRM 模块
 *
 * 提供平台级 CRM 功能，包括：
 * - 公司管理
 * - 联系人管理
 * - 线索管理（含阶段流转校验）
 */
@Module({
  imports: [AuthModule],
  controllers: [
    PlatformCrmCompaniesController,
    PlatformCrmContactsController,
    PlatformCrmLeadsController,
  ],
  providers: [
    PlatformCrmCompaniesService,
    PlatformCrmContactsService,
    PlatformCrmLeadsService,
  ],
  exports: [
    PlatformCrmCompaniesService,
    PlatformCrmContactsService,
    PlatformCrmLeadsService,
  ],
})
export class PlatformCrmModule {}
