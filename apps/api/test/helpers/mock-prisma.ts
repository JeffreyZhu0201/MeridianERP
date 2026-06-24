import {
  ActivityType,
  BindType,
  CommissionType,
  LeadStage,
  LedgerStatus,
  MerchantRole,
  OnboardingStatus,
  OrderStatus,
  PlatformRole,
  Prisma,
  SettlementBatchStatus,
} from '@prisma/client';

type Id = string;
let idCounter = 0;
const nextId = (prefix: string) => `${prefix}_${++idCounter}`;

export function createMockPrisma() {
  const platformUsers = new Map<Id, PlatformUserRecord>();
  const tenants = new Map<Id, TenantRecord>();
  const merchantProfiles = new Map<Id, MerchantProfileRecord>();
  const users = new Map<Id, UserRecord>();
  const companies = new Map<Id, CrmCompanyRecord>();
  const contacts = new Map<Id, CrmContactRecord>();
  const leads = new Map<Id, CrmLeadRecord>();
  const activities = new Map<Id, CrmActivityRecord>();
  const distributors = new Map<Id, DistributorRecord>();
  const qrCodes = new Map<Id, DistributorQrCodeRecord>();
  const bindings = new Map<Id, BindingRecord>();
  const customers = new Map<Id, CustomerRecord>();
  const categories = new Map<Id, CategoryRecord>();
  const products = new Map<Id, ProductRecord>();
  const productVariants = new Map<Id, ProductVariantRecord>();
  const carts = new Map<Id, CartRecord>();
  const cartItems = new Map<Id, CartItemRecord>();
  const orders = new Map<Id, OrderRecord>();
  const orderLines = new Map<Id, OrderLineRecord>();
  const commissionLedgers = new Map<Id, CommissionLedgerRecord>();
  const settlementBatches = new Map<Id, SettlementBatchRecord>();

  const orderByPaymentIntent = new Map<string, Id>();

  const profileByTenant = new Map<Id, Id>();
  const qrByToken = new Map<string, Id>();

  interface PlatformUserRecord {
    id: Id;
    email: string;
    password: string;
    role: PlatformRole;
    createdAt: Date;
    updatedAt: Date;
  }

  interface TenantRecord {
    id: Id;
    slug: string;
    createdAt: Date;
    updatedAt: Date;
  }

  interface MerchantProfileRecord {
    id: Id;
    tenantId: Id;
    businessName: string;
    legalName: string | null;
    contactEmail: string;
    contactPhone: string | null;
    onboardingStatus: OnboardingStatus;
    rejectionReason: string | null;
    submittedAt: Date | null;
    reviewedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }

  interface UserRecord {
    id: Id;
    tenantId: Id;
    email: string;
    password: string;
    role: MerchantRole;
    createdAt: Date;
    updatedAt: Date;
  }

  interface CrmCompanyRecord {
    id: Id;
    tenantId: Id;
    name: string;
    website: string | null;
    createdAt: Date;
    updatedAt: Date;
  }

  interface CrmContactRecord {
    id: Id;
    tenantId: Id;
    companyId: string | null;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    createdAt: Date;
    updatedAt: Date;
  }

  interface CrmLeadRecord {
    id: Id;
    tenantId: Id;
    contactId: string | null;
    title: string;
    stage: LeadStage;
    source: string | null;
    distributorId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }

  interface CrmActivityRecord {
    id: Id;
    tenantId: Id;
    contactId: string | null;
    leadId: string | null;
    type: ActivityType;
    note: string;
    createdAt: Date;
  }

  interface DistributorRecord {
    id: Id;
    tenantId: Id;
    name: string;
    email: string | null;
    phone: string | null;
    commissionRate: Prisma.Decimal;
    commissionType: CommissionType;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }

  interface DistributorQrCodeRecord {
    id: Id;
    distributorId: Id;
    token: string;
    bindType: BindType;
    expiresAt: Date;
    createdAt: Date;
  }

  interface BindingRecord {
    id: Id;
    tenantId: Id;
    distributorId: Id;
    bindableType: BindType;
    bindableId: string;
    boundAt: Date;
  }

  interface CustomerRecord {
    id: Id;
    tenantId: Id;
    email: string;
    password: string;
    firstName: string | null;
    lastName: string | null;
    createdAt: Date;
    updatedAt: Date;
  }

  interface CategoryRecord {
    id: Id;
    tenantId: Id;
    parentId: string | null;
    name: string;
    slug: string;
    createdAt: Date;
    updatedAt: Date;
  }

  interface ProductRecord {
    id: Id;
    tenantId: Id;
    categoryId: string | null;
    name: string;
    slug: string;
    description: string | null;
    isPublished: boolean;
    createdAt: Date;
    updatedAt: Date;
  }

  interface ProductVariantRecord {
    id: Id;
    productId: Id;
    sku: string;
    name: string;
    price: Prisma.Decimal;
    inventory: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }

  interface CartRecord {
    id: Id;
    tenantId: Id;
    customerId: string | null;
    sessionId: string | null;
    distributorId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }

  interface CartItemRecord {
    id: Id;
    cartId: Id;
    variantId: Id;
    quantity: number;
    createdAt: Date;
    updatedAt: Date;
  }

  interface OrderRecord {
    id: Id;
    tenantId: Id;
    customerId: string | null;
    distributorId: string | null;
    status: OrderStatus;
    currency: string;
    subtotal: Prisma.Decimal;
    tax: Prisma.Decimal;
    total: Prisma.Decimal;
    guestEmail: string | null;
    stripePaymentIntentId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }

  interface OrderLineRecord {
    id: Id;
    orderId: Id;
    variantId: string | null;
    productName: string;
    variantName: string;
    quantity: number;
    unitPrice: Prisma.Decimal;
    lineTotal: Prisma.Decimal;
  }

  interface CommissionLedgerRecord {
    id: Id;
    tenantId: Id;
    orderId: Id;
    distributorId: Id;
    amount: Prisma.Decimal;
    status: LedgerStatus;
    settlementBatchId: string | null;
    settledAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }

  interface SettlementBatchRecord {
    id: Id;
    periodStart: Date;
    periodEnd: Date;
    status: SettlementBatchStatus;
    exportedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }

  const now = () => new Date();

  const attachVariant = (variant: ProductVariantRecord, include?: Record<string, unknown>) => {
    const result: Record<string, unknown> = { ...variant };
    if (include?.product) {
      const product = products.get(variant.productId);
      if (product) {
        if (typeof include.product === 'object' && 'select' in include.product) {
          const select = include.product.select as Record<string, boolean>;
          result.product = Object.fromEntries(
            Object.keys(select)
              .filter((k) => select[k])
              .map((k) => [k, product[k as keyof ProductRecord]]),
          );
        } else {
          result.product = product;
        }
      }
    }
    return result;
  };

  const attachProduct = (product: ProductRecord, include?: Record<string, unknown>) => {
    const result: Record<string, unknown> = { ...product };
    if (include?.category) {
      result.category = product.categoryId ? categories.get(product.categoryId) ?? null : null;
    }
    if (include?.variants) {
      let variants = [...productVariants.values()].filter((v) => v.productId === product.id);
      const variantInclude = include.variants as { where?: { isActive?: boolean }; orderBy?: { createdAt: string } };
      if (variantInclude.where?.isActive !== undefined) {
        variants = variants.filter((v) => v.isActive === variantInclude.where!.isActive);
      }
      if (variantInclude.orderBy?.createdAt === 'asc') {
        variants = variants.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      }
      result.variants = variants;
    }
    return result;
  };

  const attachCart = (cart: CartRecord, include?: Record<string, unknown>) => {
    const result: Record<string, unknown> = { ...cart };
    if (include?.items) {
      const itemsInclude = include.items as { include?: { variant?: { include?: { product?: boolean } } }; orderBy?: { createdAt: string } };
      let items = [...cartItems.values()].filter((i) => i.cartId === cart.id);
      if (itemsInclude.orderBy?.createdAt === 'asc') {
        items = items.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      }
      result.items = items.map((item) => {
        const row: Record<string, unknown> = { ...item };
        if (itemsInclude.include?.variant) {
          const variant = productVariants.get(item.variantId);
          if (variant) {
            if (itemsInclude.include.variant.include?.product) {
              row.variant = { ...variant, product: products.get(variant.productId) };
            } else {
              row.variant = attachVariant(variant, itemsInclude.include.variant as Record<string, unknown>);
            }
          }
        }
        return row;
      });
    }
    if (include?.distributor) {
      result.distributor = cart.distributorId
        ? distributors.get(cart.distributorId) ?? null
        : null;
    }
    return result;
  };

  const attachOrder = (order: OrderRecord, include?: Record<string, unknown>) => {
    const result: Record<string, unknown> = { ...order };
    if (include?.lines) {
      const linesInclude = include.lines as { include?: { variant?: boolean } };
      result.lines = [...orderLines.values()]
        .filter((l) => l.orderId === order.id)
        .map((line) => {
          if (linesInclude.include?.variant && line.variantId) {
            return { ...line, variant: productVariants.get(line.variantId) };
          }
          return line;
        });
    }
    if (include?.customer && order.customerId) {
      result.customer = customers.get(order.customerId) ?? null;
    }
    if (include?.commissionEntry) {
      result.commissionEntry =
        [...commissionLedgers.values()].find((e) => e.orderId === order.id) ?? null;
    }
    if (include?.distributor && order.distributorId) {
      result.distributor = distributors.get(order.distributorId) ?? null;
    }
    if (include?.tenant) {
      const tenant = tenants.get(order.tenantId);
      if (typeof include.tenant === 'object' && 'select' in include.tenant) {
        const select = include.tenant.select as Record<string, boolean>;
        result.tenant = tenant
          ? Object.fromEntries(
              Object.keys(select)
                .filter((k) => select[k])
                .map((k) => [k, tenant[k as keyof TenantRecord]]),
            )
          : null;
      } else {
        result.tenant = tenant;
      }
    }
    return result;
  };

  const attachCommissionEntry = (
    entry: CommissionLedgerRecord,
    include?: Record<string, unknown>,
  ) => {
    const result: Record<string, unknown> = { ...entry };
    if (include?.distributor) {
      result.distributor = distributors.get(entry.distributorId);
    }
    if (include?.order) {
      const order = orders.get(entry.orderId);
      if (typeof include.order === 'object' && 'select' in include.order) {
        const select = include.order.select as Record<string, boolean>;
        result.order = order
          ? Object.fromEntries(
              Object.keys(select)
                .filter((k) => select[k])
                .map((k) => [k, order[k as keyof OrderRecord]]),
            )
          : null;
      } else {
        result.order = order;
      }
    }
    if (include?.tenant) {
      const tenant = tenants.get(entry.tenantId);
      if (typeof include.tenant === 'object' && 'select' in include.tenant) {
        const select = include.tenant.select as Record<string, boolean>;
        result.tenant = tenant
          ? Object.fromEntries(
              Object.keys(select)
                .filter((k) => select[k])
                .map((k) => [k, tenant[k as keyof TenantRecord]]),
            )
          : null;
      } else {
        result.tenant = tenant;
      }
    }
    return result;
  };

  const attachSettlementBatch = (
    batch: SettlementBatchRecord,
    include?: Record<string, unknown>,
  ) => {
    const result: Record<string, unknown> = { ...batch };
    if (include?.entries) {
      const entriesInclude = include.entries as { include?: Record<string, unknown> };
      result.entries = [...commissionLedgers.values()]
        .filter((e) => e.settlementBatchId === batch.id)
        .map((e) => attachCommissionEntry(e, entriesInclude.include));
    }
    return result;
  };

  const runTransaction = async <T>(
    arg: ((tx: typeof mock) => Promise<T>) | Promise<unknown>[],
  ): Promise<T | unknown[]> => {
    if (typeof arg === 'function') {
      return arg(mock);
    }
    if (Array.isArray(arg)) {
      return Promise.all(arg);
    }
    throw new Error('Unsupported transaction');
  };

  const mock = {
    onModuleInit: jest.fn(),
    onModuleDestroy: jest.fn(),
    $transaction: runTransaction,
    platformUser: {
      findUnique: async ({ where }: { where: { email?: string; id?: string } }) => {
        if (where.email) {
          return [...platformUsers.values()].find((u) => u.email === where.email) ?? null;
        }
        if (where.id) {
          return platformUsers.get(where.id) ?? null;
        }
        return null;
      },
      upsert: async ({
        where,
        create,
        update,
      }: {
        where: { email: string };
        create: Omit<PlatformUserRecord, 'id' | 'createdAt' | 'updatedAt'>;
        update: Partial<PlatformUserRecord>;
      }) => {
        const existing = [...platformUsers.values()].find((u) => u.email === where.email);
        if (existing) {
          const updated = { ...existing, ...update, updatedAt: now() };
          platformUsers.set(existing.id, updated);
          return updated;
        }
        const record: PlatformUserRecord = {
          id: nextId('pu'),
          createdAt: now(),
          updatedAt: now(),
          ...create,
        };
        platformUsers.set(record.id, record);
        return record;
      },
    },
    tenant: {
      create: async ({ data }: { data: { slug: string } }) => {
        const record: TenantRecord = {
          id: nextId('tenant'),
          slug: data.slug,
          createdAt: now(),
          updatedAt: now(),
        };
        tenants.set(record.id, record);
        return record;
      },
      findUnique: async ({ where }: { where: { id?: string; slug?: string } }) => {
        if (where.id) return tenants.get(where.id) ?? null;
        if (where.slug) {
          return [...tenants.values()].find((t) => t.slug === where.slug) ?? null;
        }
        return null;
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<TenantRecord>;
      }) => {
        const existing = tenants.get(where.id);
        if (!existing) throw new Error('Tenant not found');
        const updated = { ...existing, ...data, updatedAt: now() };
        tenants.set(where.id, updated);
        return updated;
      },
    },
    merchantProfile: {
      create: async ({
        data,
      }: {
        data: Omit<MerchantProfileRecord, 'id' | 'createdAt' | 'updatedAt'>;
      }) => {
        const record: MerchantProfileRecord = {
          id: nextId('mp'),
          createdAt: now(),
          updatedAt: now(),
          ...data,
        };
        merchantProfiles.set(record.id, record);
        profileByTenant.set(record.tenantId, record.id);
        return record;
      },
      findUnique: async ({
        where,
        include,
      }: {
        where: { tenantId?: string; id?: string };
        include?: Record<string, unknown>;
      }) => {
        let profile: MerchantProfileRecord | null = null;
        if (where.tenantId) {
          const id = profileByTenant.get(where.tenantId);
          profile = id ? (merchantProfiles.get(id) ?? null) : null;
        } else if (where.id) {
          profile = merchantProfiles.get(where.id) ?? null;
        }
        if (!profile) return null;
        if (include?.tenant) {
          const tenant = tenants.get(profile.tenantId);
          let tenantData: Record<string, unknown> = { ...(tenant ?? {}) };
          const tenantInclude = include.tenant as
            | boolean
            | { include?: { users?: { select?: Record<string, boolean> } } };
          if (
            typeof tenantInclude === 'object' &&
            tenantInclude?.include?.users
          ) {
            tenantData = {
              ...tenantData,
              users: [...users.values()]
                .filter((u) => u.tenantId === profile!.tenantId)
                .map(({ password: _p, ...rest }) => rest),
            };
          }
          return { ...profile, tenant: tenantData };
        }
        return profile;
      },
      findMany: async ({
        skip = 0,
        take = 20,
        orderBy,
        include,
      }: {
        skip?: number;
        take?: number;
        orderBy?: { createdAt: 'desc' | 'asc' };
        include?: { tenant?: boolean };
      }) => {
        let items = [...merchantProfiles.values()];
        if (orderBy?.createdAt === 'desc') {
          items = items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }
        items = items.slice(skip, skip + take);
        if (include?.tenant) {
          return items.map((p) => ({
            ...p,
            tenant: tenants.get(p.tenantId),
          }));
        }
        return items;
      },
      count: async () => merchantProfiles.size,
      update: async ({
        where,
        data,
      }: {
        where: { tenantId?: string; id?: string };
        data: Partial<MerchantProfileRecord>;
      }) => {
        let id = where.id;
        if (where.tenantId) {
          id = profileByTenant.get(where.tenantId);
        }
        if (!id) throw new Error('Profile not found');
        const existing = merchantProfiles.get(id);
        if (!existing) throw new Error('Profile not found');
        const updated = { ...existing, ...data, updatedAt: now() };
        merchantProfiles.set(id, updated);
        return updated;
      },
    },
    user: {
      findFirst: async ({
        where,
        include,
      }: {
        where: { email?: string };
        include?: { tenant?: { include?: { merchantProfile?: boolean } } };
      }) => {
        const user = [...users.values()].find((u) => u.email === where.email) ?? null;
        if (!user) return null;
        if (include?.tenant) {
          const tenant = tenants.get(user.tenantId);
          let tenantData: Record<string, unknown> = { ...tenant };
          if (include.tenant.include?.merchantProfile) {
            const profileId = profileByTenant.get(user.tenantId);
            tenantData = {
              ...tenantData,
              merchantProfile: profileId ? merchantProfiles.get(profileId) : null,
            };
          }
          return { ...user, tenant: tenantData };
        }
        return user;
      },
      create: async ({
        data,
      }: {
        data: Omit<UserRecord, 'id' | 'createdAt' | 'updatedAt'>;
      }) => {
        const record: UserRecord = {
          id: nextId('user'),
          createdAt: now(),
          updatedAt: now(),
          ...data,
        };
        users.set(record.id, record);
        return record;
      },
    },
    crmCompany: {
      findMany: async ({ where }: { where: { tenantId: string } }) =>
        [...companies.values()].filter((c) => c.tenantId === where.tenantId),
      findFirst: async ({ where }: { where: { id: string; tenantId: string } }) =>
        [...companies.values()].find((c) => c.id === where.id && c.tenantId === where.tenantId) ??
        null,
      create: async ({
        data,
      }: {
        data: Omit<CrmCompanyRecord, 'id' | 'createdAt' | 'updatedAt'>;
      }) => {
        const record: CrmCompanyRecord = {
          id: nextId('co'),
          createdAt: now(),
          updatedAt: now(),
          ...data,
        };
        companies.set(record.id, record);
        return record;
      },
      update: async ({ where, data }: { where: { id: string }; data: Partial<CrmCompanyRecord> }) => {
        const existing = companies.get(where.id);
        if (!existing) throw new Error('Not found');
        const updated = { ...existing, ...data, updatedAt: now() };
        companies.set(where.id, updated);
        return updated;
      },
      delete: async ({ where }: { where: { id: string } }) => {
        const existing = companies.get(where.id);
        companies.delete(where.id);
        return existing;
      },
    },
    crmContact: {
      findMany: async ({ where }: { where: { tenantId: string } }) =>
        [...contacts.values()].filter((c) => c.tenantId === where.tenantId),
      findFirst: async ({ where }: { where: { id: string; tenantId: string } }) =>
        [...contacts.values()].find((c) => c.id === where.id && c.tenantId === where.tenantId) ??
        null,
      create: async ({
        data,
      }: {
        data: Omit<CrmContactRecord, 'id' | 'createdAt' | 'updatedAt'>;
      }) => {
        const record: CrmContactRecord = {
          id: nextId('ct'),
          createdAt: now(),
          updatedAt: now(),
          ...data,
        };
        contacts.set(record.id, record);
        return record;
      },
      update: async ({ where, data }: { where: { id: string }; data: Partial<CrmContactRecord> }) => {
        const existing = contacts.get(where.id);
        if (!existing) throw new Error('Not found');
        const updated = { ...existing, ...data, updatedAt: now() };
        contacts.set(where.id, updated);
        return updated;
      },
      delete: async ({ where }: { where: { id: string } }) => {
        const existing = contacts.get(where.id);
        contacts.delete(where.id);
        return existing;
      },
    },
    crmLead: {
      findMany: async ({ where }: { where: { tenantId: string } }) =>
        [...leads.values()].filter((l) => l.tenantId === where.tenantId),
      findFirst: async ({ where }: { where: { id: string; tenantId: string } }) =>
        [...leads.values()].find((l) => l.id === where.id && l.tenantId === where.tenantId) ?? null,
      create: async ({
        data,
      }: {
        data: Omit<CrmLeadRecord, 'id' | 'createdAt' | 'updatedAt' | 'stage'> & {
          stage?: LeadStage;
        };
      }) => {
        const record: CrmLeadRecord = {
          id: nextId('lead'),
          stage: data.stage ?? LeadStage.NEW,
          createdAt: now(),
          updatedAt: now(),
          ...data,
        };
        leads.set(record.id, record);
        return record;
      },
      update: async ({ where, data }: { where: { id: string }; data: Partial<CrmLeadRecord> }) => {
        const existing = leads.get(where.id);
        if (!existing) throw new Error('Not found');
        const updated = { ...existing, ...data, updatedAt: now() };
        leads.set(where.id, updated);
        return updated;
      },
      delete: async ({ where }: { where: { id: string } }) => {
        const existing = leads.get(where.id);
        leads.delete(where.id);
        return existing;
      },
    },
    crmActivity: {
      findMany: async ({ where }: { where: { tenantId: string } }) =>
        [...activities.values()].filter((a) => a.tenantId === where.tenantId),
      findFirst: async ({ where }: { where: { id: string; tenantId: string } }) =>
        [...activities.values()].find((a) => a.id === where.id && a.tenantId === where.tenantId) ??
        null,
      create: async ({
        data,
      }: {
        data: Omit<CrmActivityRecord, 'id' | 'createdAt'>;
      }) => {
        const record: CrmActivityRecord = {
          id: nextId('act'),
          createdAt: now(),
          ...data,
        };
        activities.set(record.id, record);
        return record;
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<CrmActivityRecord>;
      }) => {
        const existing = activities.get(where.id);
        if (!existing) throw new Error('Not found');
        const updated = { ...existing, ...data };
        activities.set(where.id, updated);
        return updated;
      },
      delete: async ({ where }: { where: { id: string } }) => {
        const existing = activities.get(where.id);
        activities.delete(where.id);
        return existing;
      },
    },
    distributor: {
      findMany: async ({ where }: { where: { tenantId: string } }) =>
        [...distributors.values()].filter((d) => d.tenantId === where.tenantId),
      findFirst: async ({
        where,
        include,
      }: {
        where: { id: string; tenantId: string; isActive?: boolean };
        include?: Record<string, unknown>;
      }) => {
        const distributor =
          [...distributors.values()].find(
            (d) =>
              d.id === where.id &&
              d.tenantId === where.tenantId &&
              (where.isActive === undefined || d.isActive === where.isActive),
          ) ?? null;
        if (!distributor) return null;
        if (include?.qrCodes) {
          const codes = [...qrCodes.values()]
            .filter((q) => q.distributorId === distributor.id)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, (include.qrCodes as { take?: number }).take ?? 5);
          return { ...distributor, qrCodes: codes };
        }
        return distributor;
      },
      create: async ({
        data,
      }: {
        data: Omit<DistributorRecord, 'id' | 'createdAt' | 'updatedAt' | 'isActive'> & {
          isActive?: boolean;
        };
      }) => {
        const record: DistributorRecord = {
          id: nextId('dist'),
          isActive: data.isActive ?? true,
          createdAt: now(),
          updatedAt: now(),
          ...data,
        };
        distributors.set(record.id, record);
        return record;
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<DistributorRecord>;
      }) => {
        const existing = distributors.get(where.id);
        if (!existing) throw new Error('Not found');
        const updated = { ...existing, ...data, updatedAt: now() };
        distributors.set(where.id, updated);
        return updated;
      },
      delete: async ({ where }: { where: { id: string } }) => {
        const existing = distributors.get(where.id);
        distributors.delete(where.id);
        return existing;
      },
    },
    distributorQrCode: {
      create: async ({
        data,
      }: {
        data: Omit<DistributorQrCodeRecord, 'id' | 'createdAt'>;
      }) => {
        const record: DistributorQrCodeRecord = {
          id: nextId('qr'),
          createdAt: now(),
          ...data,
        };
        qrCodes.set(record.id, record);
        qrByToken.set(record.token, record.id);
        return record;
      },
      findUnique: async ({
        where,
        include,
      }: {
        where: { token: string };
        include?: { distributor?: boolean };
      }) => {
        const id = qrByToken.get(where.token);
        if (!id) return null;
        const qr = qrCodes.get(id);
        if (!qr) return null;
        if (include?.distributor) {
          return { ...qr, distributor: distributors.get(qr.distributorId) };
        }
        return qr;
      },
    },
    customer: {
      findUnique: async ({
        where,
      }: {
        where:
          | { id: string }
          | { tenantId_email: { tenantId: string; email: string } };
      }) => {
        if ('id' in where) {
          return customers.get(where.id) ?? null;
        }
        const { tenantId, email } = where.tenantId_email;
        return (
          [...customers.values()].find(
            (c) => c.tenantId === tenantId && c.email === email,
          ) ?? null
        );
      },
      create: async ({
        data,
      }: {
        data: Omit<CustomerRecord, 'id' | 'createdAt' | 'updatedAt'>;
      }) => {
        const record: CustomerRecord = {
          id: nextId('cust'),
          createdAt: now(),
          updatedAt: now(),
          ...data,
        };
        customers.set(record.id, record);
        return record;
      },
    },
    category: {
      findMany: async ({ where }: { where: { tenantId: string } }) =>
        [...categories.values()].filter((c) => c.tenantId === where.tenantId),
      findFirst: async ({
        where,
      }: {
        where: { id?: string; tenantId?: string; slug?: string; NOT?: { id: string } };
      }) => {
        let items = [...categories.values()];
        if (where.id) items = items.filter((c) => c.id === where.id);
        if (where.tenantId) items = items.filter((c) => c.tenantId === where.tenantId);
        if (where.slug) items = items.filter((c) => c.slug === where.slug);
        if (where.NOT?.id) items = items.filter((c) => c.id !== where.NOT!.id);
        return items[0] ?? null;
      },
      create: async ({
        data,
      }: {
        data: Omit<CategoryRecord, 'id' | 'createdAt' | 'updatedAt'>;
      }) => {
        const record: CategoryRecord = {
          id: nextId('cat'),
          createdAt: now(),
          updatedAt: now(),
          ...data,
        };
        categories.set(record.id, record);
        return record;
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<CategoryRecord> & {
          parent?: { connect?: { id: string }; disconnect?: boolean };
        };
      }) => {
        const existing = categories.get(where.id);
        if (!existing) throw new Error('Category not found');
        const updated: CategoryRecord = {
          ...existing,
          ...data,
          parentId:
            data.parent?.connect?.id ??
            (data.parent?.disconnect ? null : (data.parentId ?? existing.parentId)),
          updatedAt: now(),
        };
        categories.set(where.id, updated);
        return updated;
      },
      delete: async ({ where }: { where: { id: string } }) => {
        const existing = categories.get(where.id);
        categories.delete(where.id);
        return existing;
      },
    },
    product: {
      findMany: async ({
        where,
        include,
        orderBy,
      }: {
        where: { tenantId: string; isPublished?: boolean };
        include?: { category?: boolean; variants?: { where?: { isActive?: boolean }; orderBy?: { createdAt: string } } };
        orderBy?: { createdAt: 'desc' | 'asc' };
      }) => {
        let items = [...products.values()].filter((p) => p.tenantId === where.tenantId);
        if (where.isPublished !== undefined) {
          items = items.filter((p) => p.isPublished === where.isPublished);
        }
        if (orderBy?.createdAt === 'desc') {
          items = items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }
        return items.map((p) => attachProduct(p, include));
      },
      findFirst: async ({
        where,
        include,
      }: {
        where: {
          id?: string;
          tenantId?: string;
          slug?: string;
          isPublished?: boolean;
          NOT?: { id: string };
        };
        include?: { category?: boolean | { select: Record<string, boolean> }; variants?: { where?: { isActive?: boolean }; orderBy?: { createdAt: string } } };
      }) => {
        let items = [...products.values()];
        if (where.id) items = items.filter((p) => p.id === where.id);
        if (where.tenantId) items = items.filter((p) => p.tenantId === where.tenantId);
        if (where.slug) items = items.filter((p) => p.slug === where.slug);
        if (where.isPublished !== undefined) {
          items = items.filter((p) => p.isPublished === where.isPublished);
        }
        if (where.NOT?.id) items = items.filter((p) => p.id !== where.NOT!.id);
        const product = items[0];
        if (!product) return null;
        return attachProduct(product, include);
      },
      create: async ({
        data,
        include,
      }: {
        data: Omit<ProductRecord, 'id' | 'createdAt' | 'updatedAt'> & {
          variants?: { create: Array<Omit<ProductVariantRecord, 'id' | 'productId' | 'createdAt' | 'updatedAt'>> };
        };
        include?: { category?: boolean; variants?: boolean };
      }) => {
        const { variants, ...productData } = data;
        const record: ProductRecord = {
          id: nextId('prod'),
          createdAt: now(),
          updatedAt: now(),
          ...productData,
        };
        products.set(record.id, record);
        if (variants?.create) {
          for (const v of variants.create) {
            const variant: ProductVariantRecord = {
              id: nextId('var'),
              productId: record.id,
              createdAt: now(),
              updatedAt: now(),
              inventory: v.inventory ?? 0,
              isActive: v.isActive ?? true,
              ...v,
            };
            productVariants.set(variant.id, variant);
          }
        }
        return attachProduct(record, include);
      },
      update: async ({
        where,
        data,
        include,
      }: {
        where: { id: string };
        data: Partial<ProductRecord> & { category?: { connect?: { id: string }; disconnect?: boolean } };
        include?: { category?: boolean; variants?: { orderBy?: { createdAt: string } } };
      }) => {
        const existing = products.get(where.id);
        if (!existing) throw new Error('Product not found');
        const updated: ProductRecord = {
          ...existing,
          ...data,
          categoryId:
            data.category?.connect?.id ??
            (data.category?.disconnect ? null : (data.categoryId ?? existing.categoryId)),
          updatedAt: now(),
        };
        products.set(where.id, updated);
        return attachProduct(updated, include);
      },
      delete: async ({ where }: { where: { id: string } }) => {
        const existing = products.get(where.id);
        products.delete(where.id);
        for (const [vid, v] of productVariants) {
          if (v.productId === where.id) productVariants.delete(vid);
        }
        return existing;
      },
    },
    productVariant: {
      findFirst: async ({
        where,
      }: {
        where: {
          id?: string;
          isActive?: boolean;
          product?: { tenantId?: string; isPublished?: boolean };
        };
      }) => {
        let items = [...productVariants.values()];
        if (where.id) items = items.filter((v) => v.id === where.id);
        if (where.isActive !== undefined) {
          items = items.filter((v) => v.isActive === where.isActive);
        }
        if (where.product) {
          items = items.filter((v) => {
            const product = products.get(v.productId);
            if (!product) return false;
            if (where.product?.tenantId && product.tenantId !== where.product.tenantId) {
              return false;
            }
            if (
              where.product?.isPublished !== undefined &&
              product.isPublished !== where.product.isPublished
            ) {
              return false;
            }
            return true;
          });
        }
        const variant = items[0];
        if (!variant) return null;
        return attachVariant(variant, { product: { select: { id: true, name: true, slug: true, isPublished: true } } });
      },
      createMany: async ({
        data,
      }: {
        data: Array<Omit<ProductVariantRecord, 'id' | 'createdAt' | 'updatedAt'>>;
      }) => {
        for (const item of data) {
          const record: ProductVariantRecord = {
            id: nextId('var'),
            createdAt: now(),
            updatedAt: now(),
            ...item,
          };
          productVariants.set(record.id, record);
        }
        return { count: data.length };
      },
      deleteMany: async ({ where }: { where: { productId: string } }) => {
        let count = 0;
        for (const [id, v] of productVariants) {
          if (v.productId === where.productId) {
            productVariants.delete(id);
            count++;
          }
        }
        return { count };
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<ProductVariantRecord> & { inventory?: { decrement: number } | number };
      }) => {
        const existing = productVariants.get(where.id);
        if (!existing) throw new Error('Variant not found');
        let inventory = existing.inventory;
        if (typeof data.inventory === 'number') {
          inventory = data.inventory;
        } else if (data.inventory && typeof data.inventory === 'object' && 'decrement' in data.inventory) {
          inventory -= data.inventory.decrement;
        }
        const updated = { ...existing, ...data, inventory, updatedAt: now() };
        productVariants.set(where.id, updated);
        return updated;
      },
    },
    cart: {
      findFirst: async ({
        where,
        include,
      }: {
        where: {
          tenantId?: string;
          customerId?: string | null;
          sessionId?: string;
          id?: string;
        };
        include?: Record<string, unknown>;
      }) => {
        let items = [...carts.values()];
        if (where.id) items = items.filter((c) => c.id === where.id);
        if (where.tenantId) items = items.filter((c) => c.tenantId === where.tenantId);
        if (where.customerId !== undefined) {
          items = items.filter((c) => c.customerId === where.customerId);
        }
        if (where.sessionId) items = items.filter((c) => c.sessionId === where.sessionId);
        const cart = items[0];
        if (!cart) return null;
        return attachCart(cart, include);
      },
      findUniqueOrThrow: async ({
        where,
        include,
      }: {
        where: { id: string };
        include?: Record<string, unknown>;
      }) => {
        const cart = carts.get(where.id);
        if (!cart) throw new Error('Cart not found');
        return attachCart(cart, include);
      },
      create: async ({
        data,
        include,
      }: {
        data: Omit<CartRecord, 'id' | 'createdAt' | 'updatedAt'>;
        include?: Record<string, unknown>;
      }) => {
        const record: CartRecord = {
          id: nextId('cart'),
          createdAt: now(),
          updatedAt: now(),
          customerId: data.customerId ?? null,
          sessionId: data.sessionId ?? null,
          distributorId: data.distributorId ?? null,
          ...data,
        };
        carts.set(record.id, record);
        return attachCart(record, include);
      },
      update: async ({
        where,
        data,
        include,
      }: {
        where: { id: string };
        data: Partial<CartRecord>;
        include?: Record<string, unknown>;
      }) => {
        const existing = carts.get(where.id);
        if (!existing) throw new Error('Cart not found');
        const updated = { ...existing, ...data, updatedAt: now() };
        carts.set(where.id, updated);
        return attachCart(updated, include);
      },
    },
    cartItem: {
      findUnique: async ({
        where,
      }: {
        where: { cartId_variantId: { cartId: string; variantId: string } };
      }) => {
        const { cartId, variantId } = where.cartId_variantId;
        return (
          [...cartItems.values()].find(
            (i) => i.cartId === cartId && i.variantId === variantId,
          ) ?? null
        );
      },
      findFirst: async ({
        where,
      }: {
        where: { id?: string; cartId?: string };
      }) => {
        let items = [...cartItems.values()];
        if (where.id) items = items.filter((i) => i.id === where.id);
        if (where.cartId) items = items.filter((i) => i.cartId === where.cartId);
        return items[0] ?? null;
      },
      create: async ({
        data,
      }: {
        data: Omit<CartItemRecord, 'id' | 'createdAt' | 'updatedAt'>;
      }) => {
        const record: CartItemRecord = {
          id: nextId('ci'),
          createdAt: now(),
          updatedAt: now(),
          ...data,
        };
        cartItems.set(record.id, record);
        return record;
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<CartItemRecord>;
      }) => {
        const existing = cartItems.get(where.id);
        if (!existing) throw new Error('Cart item not found');
        const updated = { ...existing, ...data, updatedAt: now() };
        cartItems.set(where.id, updated);
        return updated;
      },
      delete: async ({ where }: { where: { id: string } }) => {
        const existing = cartItems.get(where.id);
        cartItems.delete(where.id);
        return existing;
      },
      deleteMany: async ({ where }: { where: { cartId: string } }) => {
        let count = 0;
        for (const [id, item] of cartItems) {
          if (item.cartId === where.cartId) {
            cartItems.delete(id);
            count++;
          }
        }
        return { count };
      },
    },
    order: {
      findMany: async ({
        where,
        include,
        skip,
        take,
        orderBy,
      }: {
        where?: { tenantId?: string };
        include?: Record<string, unknown>;
        skip?: number;
        take?: number;
        orderBy?: { createdAt: 'desc' | 'asc' };
      }) => {
        let items = [...orders.values()];
        if (where?.tenantId) items = items.filter((o) => o.tenantId === where.tenantId);
        if (orderBy?.createdAt === 'desc') {
          items = items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }
        if (skip !== undefined && take !== undefined) {
          items = items.slice(skip, skip + take);
        }
        return items.map((o) => attachOrder(o, include));
      },
      findFirst: async ({
        where,
        include,
      }: {
        where: { id?: string; tenantId?: string };
        include?: Record<string, unknown>;
      }) => {
        let items = [...orders.values()];
        if (where.id) items = items.filter((o) => o.id === where.id);
        if (where.tenantId) items = items.filter((o) => o.tenantId === where.tenantId);
        const order = items[0];
        if (!order) return null;
        return attachOrder(order, include);
      },
      findUnique: async ({
        where,
        include,
      }: {
        where: { id?: string; stripePaymentIntentId?: string };
        include?: Record<string, unknown>;
      }) => {
        let order: OrderRecord | null = null;
        if (where.id) order = orders.get(where.id) ?? null;
        if (where.stripePaymentIntentId) {
          const id = orderByPaymentIntent.get(where.stripePaymentIntentId);
          order = id ? (orders.get(id) ?? null) : null;
        }
        if (!order) return null;
        return attachOrder(order, include);
      },
      create: async ({
        data,
        include,
      }: {
        data: Omit<OrderRecord, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'currency'> & {
          status?: OrderStatus;
          currency?: string;
          lines?: {
            create: Array<Omit<OrderLineRecord, 'id' | 'orderId'>>;
          };
        };
        include?: Record<string, unknown>;
      }) => {
        const { lines, ...orderData } = data;
        const record: OrderRecord = {
          id: nextId('ord'),
          status: orderData.status ?? OrderStatus.PENDING_PAYMENT,
          currency: orderData.currency ?? 'USD',
          createdAt: now(),
          updatedAt: now(),
          stripePaymentIntentId: null,
          guestEmail: orderData.guestEmail ?? null,
          distributorId: orderData.distributorId ?? null,
          customerId: orderData.customerId ?? null,
          ...orderData,
        };
        orders.set(record.id, record);
        if (lines?.create) {
          for (const line of lines.create) {
            const orderLine: OrderLineRecord = {
              id: nextId('ol'),
              orderId: record.id,
              ...line,
            };
            orderLines.set(orderLine.id, orderLine);
          }
        }
        return attachOrder(record, include);
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<OrderRecord>;
      }) => {
        const existing = orders.get(where.id);
        if (!existing) throw new Error('Order not found');
        const updated = { ...existing, ...data, updatedAt: now() };
        orders.set(where.id, updated);
        if (updated.stripePaymentIntentId) {
          orderByPaymentIntent.set(updated.stripePaymentIntentId, updated.id);
        }
        return updated;
      },
    },
    commissionLedger: {
      findMany: async ({
        where,
        include,
      }: {
        where: {
          status?: LedgerStatus;
          createdAt?: { gte?: Date; lte?: Date };
          settlementBatchId?: null;
        };
        include?: Record<string, unknown>;
      }) => {
        let items = [...commissionLedgers.values()];
        if (where.status) items = items.filter((e) => e.status === where.status);
        if (where.settlementBatchId === null) {
          items = items.filter((e) => e.settlementBatchId === null);
        }
        if (where.createdAt?.gte) {
          items = items.filter((e) => e.createdAt >= where.createdAt!.gte!);
        }
        if (where.createdAt?.lte) {
          items = items.filter((e) => e.createdAt <= where.createdAt!.lte!);
        }
        return items.map((e) => attachCommissionEntry(e, include));
      },
      create: async ({
        data,
      }: {
        data: Omit<CommissionLedgerRecord, 'id' | 'createdAt' | 'updatedAt' | 'settledAt' | 'settlementBatchId'> & {
          status?: LedgerStatus;
        };
      }) => {
        const record: CommissionLedgerRecord = {
          id: nextId('cl'),
          settlementBatchId: null,
          settledAt: null,
          status: data.status ?? LedgerStatus.ACCRUED,
          createdAt: now(),
          updatedAt: now(),
          ...data,
        };
        commissionLedgers.set(record.id, record);
        return record;
      },
      updateMany: async ({
        where,
        data,
      }: {
        where: { id: { in: string[] } };
        data: Partial<CommissionLedgerRecord>;
      }) => {
        let count = 0;
        for (const id of where.id.in) {
          const existing = commissionLedgers.get(id);
          if (existing) {
            commissionLedgers.set(id, { ...existing, ...data, updatedAt: now() });
            count++;
          }
        }
        return { count };
      },
    },
    settlementBatch: {
      findMany: async ({
        include,
        orderBy,
      }: {
        include?: Record<string, unknown>;
        orderBy?: { createdAt: 'desc' | 'asc' };
      }) => {
        let items = [...settlementBatches.values()];
        if (orderBy?.createdAt === 'desc') {
          items = items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }
        return items.map((b) => attachSettlementBatch(b, include));
      },
      create: async ({
        data,
      }: {
        data: Omit<SettlementBatchRecord, 'id' | 'createdAt' | 'updatedAt'>;
      }) => {
        const record: SettlementBatchRecord = {
          id: nextId('sb'),
          createdAt: now(),
          updatedAt: now(),
          ...data,
        };
        settlementBatches.set(record.id, record);
        return record;
      },
      findUniqueOrThrow: async ({
        where,
        include,
      }: {
        where: { id: string };
        include?: Record<string, unknown>;
      }) => {
        const batch = settlementBatches.get(where.id);
        if (!batch) throw new Error('Settlement batch not found');
        return attachSettlementBatch(batch, include);
      },
    },
    binding: {
      findUnique: async ({
        where,
      }: {
        where: { bindableType_bindableId: { bindableType: BindType; bindableId: string } };
      }) => {
        const { bindableType, bindableId } = where.bindableType_bindableId;
        return (
          [...bindings.values()].find(
            (b) => b.bindableType === bindableType && b.bindableId === bindableId,
          ) ?? null
        );
      },
      findMany: async ({
        where,
      }: {
        where: { tenantId: string; distributorId: string };
      }) =>
        [...bindings.values()].filter(
          (b) => b.tenantId === where.tenantId && b.distributorId === where.distributorId,
        ),
      create: async ({
        data,
      }: {
        data: Omit<BindingRecord, 'id' | 'boundAt'>;
      }) => {
        const record: BindingRecord = {
          id: nextId('bind'),
          boundAt: now(),
          ...data,
        };
        bindings.set(record.id, record);
        return record;
      },
    },
    _seedPlatformAdmin: async (email: string, password: string, role: PlatformRole) => {
      await mock.platformUser.upsert({
        where: { email },
        create: { email, password, role },
        update: { password, role },
      });
    },
    _seedApprovedTenant: async (slug: string, businessName: string) => {
      const tenant = await mock.tenant.create({ data: { slug } });
      await mock.merchantProfile.create({
        data: {
          tenantId: tenant.id,
          businessName,
          contactEmail: `${slug}@merchant.test`,
          onboardingStatus: OnboardingStatus.APPROVED,
        },
      });
      return tenant;
    },
    _seedMerchantOwner: async (
      slug: string,
      businessName: string,
      email: string,
      password: string,
    ) => {
      const tenant = await mock._seedApprovedTenant(slug, businessName);
      const user = await mock.user.create({
        data: {
          tenantId: tenant.id,
          email,
          password,
          role: MerchantRole.MERCHANT_OWNER,
        },
      });
      return { tenant, user };
    },
  };

  return mock;
}

export type MockPrisma = ReturnType<typeof createMockPrisma>;
