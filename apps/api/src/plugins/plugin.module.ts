import { Global, Module } from '@nestjs/common';
import { PluginGuard } from './plugin.guard';
import { CrmPluginGuard } from './crm-plugin.guard';
import { PluginService } from './plugin.service';

@Global()
@Module({
  providers: [PluginService, PluginGuard, CrmPluginGuard],
  exports: [PluginService, PluginGuard, CrmPluginGuard],
})
export class PluginModule {}
