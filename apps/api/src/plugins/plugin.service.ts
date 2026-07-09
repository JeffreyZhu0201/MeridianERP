import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import {
  PluginCatalogStatus,
  Prisma,
  TenantPluginStatus,
} from '@prisma/client';
import type {
  MerchantInstalledPluginsResponse,
  MerchantPluginCatalogItem,
  MerchantPluginCatalogResponse,
  MerchantPluginCode,
  PlatformMerchantPluginItem,
  PlatformMerchantPluginsResponse,
  PluginNavRoute,
} from '@meridian/shared';
import { PLUGIN_NOT_INSTALLED } from '@meridian/shared';
import { PrismaService } from '../prisma/prisma.service';
import { PLUGIN_CATALOG_SEED } from './plugin-catalog.seed';

@Injectable()
export class PluginService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.ensureCatalog();
  }

  async ensureCatalog() {
    for (const entry of PLUGIN_CATALOG_SEED) {
      await this.prisma.pluginDefinition.upsert({
        where: { code: entry.code },
        create: {
          code: entry.code,
          category: entry.category,
          icon: entry.icon,
          sortOrder: entry.sortOrder,
          nameKey: entry.nameKey,
          descriptionKey: entry.descriptionKey,
          navRoutes: entry.navRoutes
            ? (entry.navRoutes as unknown as Prisma.InputJsonValue)
            : undefined,
          status: PluginCatalogStatus.ACTIVE,
          isDefaultOnSignup: entry.isDefaultOnSignup,
        },
        update: {
          category: entry.category,
          icon: entry.icon,
          sortOrder: entry.sortOrder,
          nameKey: entry.nameKey,
          descriptionKey: entry.descriptionKey,
          navRoutes: entry.navRoutes
            ? (entry.navRoutes as unknown as Prisma.InputJsonValue)
            : undefined,
          isDefaultOnSignup: entry.isDefaultOnSignup,
        },
      });
    }
  }

  private toCatalogItem(
    plugin: {
      code: string;
      category: string;
      icon: string;
      sortOrder: number;
      nameKey: string;
      descriptionKey: string;
      navRoutes: unknown;
      status: PluginCatalogStatus;
      isDefaultOnSignup: boolean;
    },
    installation: { installedAt: Date } | null,
  ): MerchantPluginCatalogItem {
    return {
      code: plugin.code as MerchantPluginCode,
      category: plugin.category as MerchantPluginCatalogItem['category'],
      icon: plugin.icon,
      sortOrder: plugin.sortOrder,
      nameKey: plugin.nameKey,
      descriptionKey: plugin.descriptionKey,
      navRoutes: (plugin.navRoutes as PluginNavRoute[] | null) ?? null,
      status: plugin.status,
      isDefaultOnSignup: plugin.isDefaultOnSignup,
      installed: installation != null,
      installedAt: installation?.installedAt.toISOString() ?? null,
    };
  }

  async isInstalled(
    tenantId: string,
    code: MerchantPluginCode,
  ): Promise<boolean> {
    const plugin = await this.prisma.pluginDefinition.findUnique({
      where: { code },
    });
    if (!plugin) return false;

    const installation = await this.prisma.tenantPlugin.findUnique({
      where: {
        tenantId_pluginId: { tenantId, pluginId: plugin.id },
      },
    });
    return installation?.status === TenantPluginStatus.INSTALLED;
  }

  assertInstalled(installed: boolean) {
    if (!installed) {
      throw new ForbiddenException({
        message: 'Plugin is not installed for this merchant',
        code: PLUGIN_NOT_INSTALLED,
      });
    }
  }

  async getInstalledCodes(
    tenantId: string,
  ): Promise<MerchantInstalledPluginsResponse> {
    const installations = await this.prisma.tenantPlugin.findMany({
      where: { tenantId, status: TenantPluginStatus.INSTALLED },
      include: { plugin: true },
      orderBy: { plugin: { sortOrder: 'asc' } },
    });
    return {
      codes: installations.map((row) => row.plugin.code as MerchantPluginCode),
    };
  }

  async listCatalog(tenantId: string): Promise<MerchantPluginCatalogResponse> {
    await this.ensureCatalog();
    const [plugins, installations] = await Promise.all([
      this.prisma.pluginDefinition.findMany({
        where: { status: { not: PluginCatalogStatus.DEPRECATED } },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.tenantPlugin.findMany({
        where: { tenantId, status: TenantPluginStatus.INSTALLED },
        include: { plugin: true },
      }),
    ]);

    const installedByPluginId = new Map(
      installations.map((row) => [row.pluginId, row]),
    );

    return {
      items: plugins.map((plugin) =>
        this.toCatalogItem(plugin, installedByPluginId.get(plugin.id) ?? null),
      ),
    };
  }

  async install(
    tenantId: string,
    code: MerchantPluginCode,
    userId?: string,
  ): Promise<MerchantPluginCatalogItem> {
    await this.ensureCatalog();
    const plugin = await this.prisma.pluginDefinition.findUnique({
      where: { code },
    });
    if (!plugin || plugin.status === PluginCatalogStatus.DEPRECATED) {
      throw new NotFoundException('Plugin not found');
    }

    const now = new Date();
    await this.prisma.tenantPlugin.upsert({
      where: {
        tenantId_pluginId: { tenantId, pluginId: plugin.id },
      },
      create: {
        tenantId,
        pluginId: plugin.id,
        status: TenantPluginStatus.INSTALLED,
        installedAt: now,
        installedByUserId: userId ?? null,
        uninstalledAt: null,
      },
      update: {
        status: TenantPluginStatus.INSTALLED,
        installedAt: now,
        installedByUserId: userId ?? null,
        uninstalledAt: null,
      },
    });

    return this.toCatalogItem(plugin, { installedAt: now });
  }

  async uninstall(tenantId: string, code: MerchantPluginCode) {
    await this.ensureCatalog();
    const plugin = await this.prisma.pluginDefinition.findUnique({
      where: { code },
    });
    if (!plugin) {
      throw new NotFoundException('Plugin not found');
    }

    const now = new Date();
    await this.prisma.tenantPlugin.upsert({
      where: {
        tenantId_pluginId: { tenantId, pluginId: plugin.id },
      },
      create: {
        tenantId,
        pluginId: plugin.id,
        status: TenantPluginStatus.UNINSTALLED,
        installedAt: now,
        uninstalledAt: now,
      },
      update: {
        status: TenantPluginStatus.UNINSTALLED,
        uninstalledAt: now,
      },
    });

    return { code, status: TenantPluginStatus.UNINSTALLED };
  }

  async installDefaultPlugins(tenantId: string, userId?: string) {
    await this.ensureCatalog();
    const defaults = await this.prisma.pluginDefinition.findMany({
      where: { isDefaultOnSignup: true },
    });
    for (const plugin of defaults) {
      await this.install(tenantId, plugin.code as MerchantPluginCode, userId);
    }
  }

  async ensureCrmForAllTenants() {
    await this.ensureCatalog();
    const crm = await this.prisma.pluginDefinition.findUnique({
      where: { code: 'crm' },
    });
    if (!crm) return;

    const tenants = await this.prisma.tenant.findMany({ select: { id: true } });
    for (const tenant of tenants) {
      await this.prisma.tenantPlugin.upsert({
        where: {
          tenantId_pluginId: { tenantId: tenant.id, pluginId: crm.id },
        },
        create: {
          tenantId: tenant.id,
          pluginId: crm.id,
          status: TenantPluginStatus.INSTALLED,
        },
        update: {},
      });
    }
  }

  async listForPlatformMerchant(
    merchantProfileId: string,
  ): Promise<PlatformMerchantPluginsResponse> {
    const profile = await this.prisma.merchantProfile.findUnique({
      where: { id: merchantProfileId },
    });
    if (!profile) {
      throw new NotFoundException('Merchant not found');
    }

    await this.ensureCatalog();
    const [plugins, installations] = await Promise.all([
      this.prisma.pluginDefinition.findMany({
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.tenantPlugin.findMany({
        where: { tenantId: profile.tenantId },
        include: { plugin: true },
      }),
    ]);

    const byPluginId = new Map(installations.map((row) => [row.pluginId, row]));

    const items: PlatformMerchantPluginItem[] = plugins.map((plugin) => {
      const installation = byPluginId.get(plugin.id);
      const installed = installation?.status === TenantPluginStatus.INSTALLED;
      return {
        code: plugin.code as MerchantPluginCode,
        nameKey: plugin.nameKey,
        installed,
        installedAt: installed ? installation.installedAt.toISOString() : null,
        uninstalledAt: installation?.uninstalledAt?.toISOString() ?? null,
      };
    });

    return { tenantId: profile.tenantId, plugins: items };
  }
}
