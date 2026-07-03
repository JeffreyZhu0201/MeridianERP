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
  PurchaseOrderStatus,
  SettlementBatchStatus,
  StockAdjustmentReason,
  StockTransferStatus,
} from '@prisma/client';

type Id = string;
let idCounter = 0;
const nextId = (prefix: string) => `${prefix}_${++idCounter}`;

type MockCreateInput<
  T,
  OmitKeys extends keyof T,
  OptionalKeys extends keyof T = never,
> = Omit<T, OmitKeys | OptionalKeys> & Partial<Pick<T, OptionalKeys>>;

export function createMockPrisma() {
  const platformUsers = new Map<Id, PlatformUserRecord>();
  const platformAccounts = new Map<Id, PlatformAccountRecord>();
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
  const inventorySettings = new Map<Id, TenantInventorySettingsRecord>();
  const tenantSettings = new Map<Id, TenantSettingsRecord>();
  const platformSettings = new Map<Id, PlatformSettingsRecord>();
  const warehouses = new Map<Id, WarehouseRecord>();
  const stockLevels = new Map<Id, StockLevelRecord>();
  const stockAdjustments = new Map<Id, StockAdjustmentRecord>();
  const purchaseOrders = new Map<Id, PurchaseOrderRecord>();
  const purchaseOrderLines = new Map<Id, PurchaseOrderLineRecord>();
  const purchaseOrderReceipts = new Map<Id, PurchaseOrderReceiptRecord>();
  const purchaseOrderReceiptLines = new Map<Id, PurchaseOrderReceiptLineRecord>();
  const stockTransfers = new Map<Id, StockTransferRecord>();
  const stockTransferLines = new Map<Id, StockTransferLineRecord>();

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

  interface PlatformAccountRecord {
    id: Id;
    email: string;
    password: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
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
    recruitedByDistributorId: string | null;
    recruitedAt: Date | null;
    pendingRecruitInviteCode: string | null;
    storePublished: boolean;
    createdAt: Date;
    updatedAt: Date;
  }

  interface UserRecord {
    id: Id;
    tenantId: Id;
    accountId: Id;
    email: string;
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
    tenantId: Id | null;
    name: string;
    email: string | null;
    phone: string | null;
    passwordHash: string | null;
    portalEnabled: boolean;
    lastLoginAt: Date | null;
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
    revokedAt: Date | null;
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
    accountId: Id;
    email: string;
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
    reorderThreshold: number | null;
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

  interface TenantInventorySettingsRecord {
    tenantId: Id;
    defaultReorderThreshold: number;
    createdAt: Date;
    updatedAt: Date;
  }

  interface TenantSettingsRecord {
    tenantId: Id;
    defaultCommissionRate: Prisma.Decimal | null;
    defaultCommissionType: CommissionType | null;
    notifyOnBinding: boolean;
    notifyOnCommission: boolean;
    createdAt: Date;
    updatedAt: Date;
  }

  interface PlatformSettingsRecord {
    id: Id;
    platformName: string;
    supportEmail: string | null;
    distributorPortalEnabled: boolean;
    emailQueueEnabled: boolean;
    updatedAt: Date;
  }

  interface WarehouseRecord {
    id: Id;
    tenantId: Id;
    name: string;
    address: string | null;
    isDefault: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }

  interface StockLevelRecord {
    id: Id;
    tenantId: Id;
    warehouseId: Id;
    variantId: Id;
    quantityOnHand: number;
    createdAt: Date;
    updatedAt: Date;
  }

  interface StockAdjustmentRecord {
    id: Id;
    tenantId: Id;
    warehouseId: Id;
    variantId: Id;
    actorId: Id;
    reason: StockAdjustmentReason;
    note: string | null;
    quantityDelta: number;
    quantityBefore: number;
    quantityAfter: number;
    createdAt: Date;
  }

  interface PurchaseOrderRecord {
    id: Id;
    tenantId: Id;
    warehouseId: Id;
    supplierName: string;
    status: PurchaseOrderStatus;
    poNumber: string;
    createdById: Id;
    orderedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }

  interface PurchaseOrderLineRecord {
    id: Id;
    purchaseOrderId: Id;
    variantId: Id;
    quantityOrdered: number;
    quantityReceived: number;
    createdAt: Date;
    updatedAt: Date;
  }

  interface PurchaseOrderReceiptRecord {
    id: Id;
    tenantId: Id;
    purchaseOrderId: Id;
    receivedById: Id;
    note: string | null;
    createdAt: Date;
  }

  interface PurchaseOrderReceiptLineRecord {
    id: Id;
    receiptId: Id;
    purchaseOrderLineId: Id;
    quantityReceived: number;
  }

  interface StockTransferRecord {
    id: Id;
    tenantId: Id;
    fromWarehouseId: Id;
    toWarehouseId: Id;
    status: StockTransferStatus;
    note: string | null;
    createdById: Id;
    createdAt: Date;
  }

  interface StockTransferLineRecord {
    id: Id;
    transferId: Id;
    variantId: Id;
    quantity: number;
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

  const attachOrder = (
    order: OrderRecord,
    include?: Record<string, unknown>,
  ): OrderRecord & Record<string, unknown> => {
    const result: OrderRecord & Record<string, unknown> = { ...order };
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
    if (include?._count) {
      const countInclude = include._count as { select?: { lines?: boolean } };
      if (countInclude.select?.lines) {
        result._count = {
          lines: [...orderLines.values()].filter((l) => l.orderId === order.id).length,
        };
      }
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
  ): CommissionLedgerRecord & Record<string, unknown> => {
    const result: CommissionLedgerRecord & Record<string, unknown> = { ...entry };
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
    if (include?.settlementBatch) {
      result.settlementBatch = entry.settlementBatchId
        ? (settlementBatches.get(entry.settlementBatchId) ?? null)
        : null;
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

  const applyDateRange = (
    date: Date,
    range?: { gte?: Date; lte?: Date },
  ) => {
    if (!range) return true;
    if (range.gte && date < range.gte) return false;
    if (range.lte && date > range.lte) return false;
    return true;
  };

  const attachBinding = (
    binding: BindingRecord,
    include?: Record<string, unknown>,
  ) => {
    const result: Record<string, unknown> = { ...binding };
    if (include?.distributor) {
      const distributor = distributors.get(binding.distributorId);
      if (
        typeof include.distributor === 'object' &&
        'select' in include.distributor
      ) {
        const select = include.distributor.select as Record<string, boolean>;
        result.distributor = distributor
          ? Object.fromEntries(
              Object.keys(select)
                .filter((k) => select[k])
                .map((k) => [k, distributor[k as keyof DistributorRecord]]),
            )
          : null;
      } else {
        result.distributor = distributor;
      }
    }
    return result;
  };

  const filterBindings = (where: Record<string, unknown>) => {
    let items = [...bindings.values()];
    if (where.tenantId) items = items.filter((b) => b.tenantId === where.tenantId);
    if (where.distributorId) {
      items = items.filter((b) => b.distributorId === where.distributorId);
    }
    if (where.bindableType) {
      items = items.filter((b) => b.bindableType === where.bindableType);
    }
    if (where.boundAt) {
      items = items.filter((b) =>
        applyDateRange(b.boundAt, where.boundAt as { gte?: Date; lte?: Date }),
      );
    }
    return items;
  };

  const filterOrders = (where: Record<string, unknown>) => {
    let items = [...orders.values()];
    if (where.tenantId) items = items.filter((o) => o.tenantId === where.tenantId);
    if (where.distributorId) {
      items = items.filter((o) => o.distributorId === where.distributorId);
    }
    if (where.status) items = items.filter((o) => o.status === where.status);
    if (where.id) items = items.filter((o) => o.id === where.id);
    if (where.customerId) {
      items = items.filter((o) => o.customerId === where.customerId);
    }
    if (where.createdAt) {
      items = items.filter((o) =>
        applyDateRange(o.createdAt, where.createdAt as { gte?: Date; lte?: Date }),
      );
    }
    return items;
  };

  const filterCommissionLedgers = (where: Record<string, unknown>) => {
    let items = [...commissionLedgers.values()];
    if (where.tenantId) items = items.filter((e) => e.tenantId === where.tenantId);
    if (where.distributorId) {
      items = items.filter((e) => e.distributorId === where.distributorId);
    }
    if (where.status) {
      const status = where.status;
      if (typeof status === 'object' && status !== null && 'not' in status) {
        items = items.filter(
          (e) => e.status !== (status as { not: LedgerStatus }).not,
        );
      } else {
        items = items.filter((e) => e.status === status);
      }
    }
    if (where.createdAt) {
      items = items.filter((e) =>
        applyDateRange(e.createdAt, where.createdAt as { gte?: Date; lte?: Date }),
      );
    }
    if (where.settlementBatchId === null) {
      items = items.filter((e) => e.settlementBatchId === null);
    }
    return items;
  };

  const applyOrderSelect = (
    order: OrderRecord,
    select?: Record<string, unknown>,
  ) => {
    if (!select) return attachOrder(order);
    const result: Record<string, unknown> = {};
    if (select.createdAt) result.createdAt = order.createdAt;
    if (select.total) result.total = order.total;
    if (select.commissionEntry) {
      const entry =
        [...commissionLedgers.values()].find((e) => e.orderId === order.id) ??
        null;
      if (entry && typeof select.commissionEntry === 'object' && 'select' in select.commissionEntry) {
        const entrySelect = select.commissionEntry.select as Record<string, boolean>;
        result.commissionEntry = entry
          ? Object.fromEntries(
              Object.keys(entrySelect)
                .filter((k) => entrySelect[k])
                .map((k) => [k, entry[k as keyof CommissionLedgerRecord]]),
            )
          : null;
      } else {
        result.commissionEntry = entry;
      }
    }
    return result;
  };

  const filterStockLevels = (where: Record<string, unknown>) => {
    let items = [...stockLevels.values()];
    if (where.tenantId) items = items.filter((sl) => sl.tenantId === where.tenantId);
    if (where.warehouseId) items = items.filter((sl) => sl.warehouseId === where.warehouseId);
    if (where.variantId) items = items.filter((sl) => sl.variantId === where.variantId);
    return items;
  };

  const attachStockLevel = (sl: StockLevelRecord, include?: Record<string, unknown>) => {
    const result: Record<string, unknown> = { ...sl };
    if (include?.warehouse) {
      const warehouse = warehouses.get(sl.warehouseId);
      if (warehouse) {
        result.warehouse = { id: warehouse.id, name: warehouse.name, isDefault: warehouse.isDefault };
      }
    }
    if (include?.variant) {
      const variant = productVariants.get(sl.variantId);
      if (variant) {
        const product = products.get(variant.productId);
        result.variant = {
          ...variant,
          product: product ? { name: product.name } : undefined,
        };
      }
    }
    return result;
  };

  const filterAdjustments = (where: Record<string, unknown>) => {
    let items = [...stockAdjustments.values()];
    if (where.tenantId) items = items.filter((a) => a.tenantId === where.tenantId);
    if (where.warehouseId) items = items.filter((a) => a.warehouseId === where.warehouseId);
    if (where.variantId) items = items.filter((a) => a.variantId === where.variantId);
    if (where.reason) items = items.filter((a) => a.reason === where.reason);
    if (where.createdAt && typeof where.createdAt === 'object') {
      const createdAt = where.createdAt as { gte?: Date; lte?: Date };
      if (createdAt.gte) items = items.filter((a) => a.createdAt >= createdAt.gte!);
      if (createdAt.lte) items = items.filter((a) => a.createdAt <= createdAt.lte!);
    }
    return items;
  };

  const filterStockTransfers = (where: Record<string, unknown>) => {
    let items = [...stockTransfers.values()];
    if (where.tenantId) items = items.filter((t) => t.tenantId === where.tenantId);
    if (where.id) items = items.filter((t) => t.id === where.id);
    if (where.fromWarehouseId) {
      items = items.filter((t) => t.fromWarehouseId === where.fromWarehouseId);
    }
    if (where.toWarehouseId) {
      items = items.filter((t) => t.toWarehouseId === where.toWarehouseId);
    }
    return items;
  };

  const attachStockTransfer = (transfer: StockTransferRecord, include?: Record<string, unknown>) => {
    const result: Record<string, unknown> = { ...transfer };
    if (include?.fromWarehouse) {
      const warehouse = warehouses.get(transfer.fromWarehouseId);
      if (warehouse) result.fromWarehouse = { id: warehouse.id, name: warehouse.name };
    }
    if (include?.toWarehouse) {
      const warehouse = warehouses.get(transfer.toWarehouseId);
      if (warehouse) result.toWarehouse = { id: warehouse.id, name: warehouse.name };
    }
    if (include?.createdBy) {
      const user = users.get(transfer.createdById);
      if (user) result.createdBy = { id: user.id, email: user.email };
    }
    if (include?.lines) {
      const lineInclude =
        typeof include.lines === 'object' && 'include' in include.lines
          ? (include.lines as { include?: Record<string, unknown> }).include
          : undefined;
      result.lines = [...stockTransferLines.values()]
        .filter((line) => line.transferId === transfer.id)
        .map((line) => {
          const lineResult: Record<string, unknown> = { ...line };
          if (lineInclude?.variant) {
            const variant = productVariants.get(line.variantId);
            if (variant) {
              const product = products.get(variant.productId);
              lineResult.variant = {
                id: variant.id,
                sku: variant.sku,
                name: variant.name,
                product: product ? { name: product.name } : undefined,
              };
            }
          }
          return lineResult;
        });
    }
    return result;
  };

  const attachAdjustment = (adj: StockAdjustmentRecord, include?: Record<string, unknown>) => {
    const result: Record<string, unknown> = { ...adj };
    if (include?.actor) {
      const actor = users.get(adj.actorId);
      if (actor) result.actor = { id: actor.id, email: actor.email };
    }
    if (include?.warehouse) {
      const warehouse = warehouses.get(adj.warehouseId);
      if (warehouse) result.warehouse = { id: warehouse.id, name: warehouse.name };
    }
    if (include?.variant) {
      const variant = productVariants.get(adj.variantId);
      if (variant) {
        const product = products.get(variant.productId);
        result.variant = {
          id: variant.id,
          sku: variant.sku,
          name: variant.name,
          product: product ? { name: product.name } : undefined,
        };
      }
    }
    return result;
  };

  const filterPurchaseOrders = (where: Record<string, unknown>) => {
    let items = [...purchaseOrders.values()];
    if (where.tenantId) items = items.filter((po) => po.tenantId === where.tenantId);
    if (where.id) items = items.filter((po) => po.id === where.id);
    if (where.status) items = items.filter((po) => po.status === where.status);
    if (where.warehouseId) items = items.filter((po) => po.warehouseId === where.warehouseId);
    return items;
  };

  const attachPurchaseOrder = (po: PurchaseOrderRecord, include?: Record<string, unknown>) => {
    const result: Record<string, unknown> = { ...po };
    if (include?.warehouse) {
      const warehouse = warehouses.get(po.warehouseId);
      if (warehouse) result.warehouse = { id: warehouse.id, name: warehouse.name };
    }
    if (include?.createdBy) {
      const user = users.get(po.createdById);
      if (user) result.createdBy = { id: user.id, email: user.email };
    }
    if (include?.lines) {
      result.lines = [...purchaseOrderLines.values()]
        .filter((l) => l.purchaseOrderId === po.id)
        .map((line) => {
          const variant = productVariants.get(line.variantId);
          const product = variant ? products.get(variant.productId) : null;
          return {
            ...line,
            variant: variant
              ? {
                  id: variant.id,
                  sku: variant.sku,
                  name: variant.name,
                  product: product ? { name: product.name } : undefined,
                }
              : undefined,
          };
        });
    }
    if (include?.receipts) {
      result.receipts = [...purchaseOrderReceipts.values()]
        .filter((r) => r.purchaseOrderId === po.id)
        .map((receipt) => ({
          ...receipt,
          receivedBy: (() => {
            const user = users.get(receipt.receivedById);
            return user ? { id: user.id, email: user.email } : undefined;
          })(),
          lines: [...purchaseOrderReceiptLines.values()]
            .filter((l) => l.receiptId === receipt.id)
            .map((line) => ({
              ...line,
              purchaseOrderLine: (() => {
                const pol = purchaseOrderLines.get(line.purchaseOrderLineId);
                return pol ? { id: pol.id, variantId: pol.variantId } : undefined;
              })(),
            })),
        }));
    }
    return result;
  };

  const runTransaction = async <T>(
    arg: ((tx: any) => Promise<T>) | Promise<unknown>[],
  ): Promise<T | unknown[]> => {
    if (typeof arg === 'function') {
      return arg(mock);
    }
    if (Array.isArray(arg)) {
      return Promise.all(arg);
    }
    throw new Error('Unsupported transaction');
  };

  const filterMerchantProfiles = (
    items: MerchantProfileRecord[],
    where?: Record<string, unknown>,
  ): MerchantProfileRecord[] => {
    if (!where) return items;
    let filtered = items;
    if (where.onboardingStatus) {
      const status = where.onboardingStatus as OnboardingStatus | { in?: OnboardingStatus[] };
      if (typeof status === 'string') {
        filtered = filtered.filter((p) => p.onboardingStatus === status);
      } else if (status.in) {
        filtered = filtered.filter((p) => status.in!.includes(p.onboardingStatus));
      }
    }
    if (where.OR && Array.isArray(where.OR)) {
      const orClauses = where.OR as Array<Record<string, unknown>>;
      filtered = filtered.filter((p) =>
        orClauses.some((clause) => {
          for (const [field, cond] of Object.entries(clause)) {
            const c = cond as { contains?: string; mode?: string };
            if (c.contains) {
              const value = String((p as unknown as Record<string, unknown>)[field] ?? '').toLowerCase();
              if (!value.includes(c.contains.toLowerCase())) return false;
            }
          }
          return true;
        }),
      );
    }
    return filtered;
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
    platformAccount: {
      findUnique: async ({
        where,
        include,
      }: {
        where: { email?: string; id?: string };
        include?: Record<string, unknown>;
      }) => {
        let account: PlatformAccountRecord | null = null;
        if (where.email) {
          account =
            [...platformAccounts.values()].find(
              (a) => a.email.toLowerCase() === where.email!.toLowerCase(),
            ) ?? null;
        } else if (where.id) {
          account = platformAccounts.get(where.id) ?? null;
        }
        if (!account) return null;
        if (include) {
          return {
            ...account,
            customers: [...customers.values()]
              .filter((c) => c.accountId === account!.id)
              .map((c) => ({
                ...c,
                tenant: {
                  ...tenants.get(c.tenantId),
                  merchantProfile: (() => {
                    const pid = profileByTenant.get(c.tenantId);
                    return pid ? merchantProfiles.get(pid) : null;
                  })(),
                },
                orders: [...orders.values()].filter((o) => o.customerId === c.id),
              })),
            merchantUsers: [...users.values()]
              .filter((u) => u.accountId === account!.id)
              .map((u) => ({
                ...u,
                tenant: {
                  ...tenants.get(u.tenantId),
                  merchantProfile: (() => {
                    const pid = profileByTenant.get(u.tenantId);
                    return pid ? merchantProfiles.get(pid) : null;
                  })(),
                },
              })),
          };
        }
        return account;
      },
      findFirst: async ({ where }: { where: { email?: string } }) => {
        if (where.email) {
          return (
            [...platformAccounts.values()].find(
              (a) => a.email.toLowerCase() === where.email!.toLowerCase(),
            ) ?? null
          );
        }
        return null;
      },
      findMany: async ({
        where,
        orderBy,
        skip = 0,
        take,
        include,
      }: {
        where?: {
          OR?: Array<{
            email?: { contains: string; mode?: string };
            firstName?: { contains: string; mode?: string };
            lastName?: { contains: string; mode?: string };
          }>;
          customers?: { some: Record<string, never> };
          merchantUsers?: { some: { role?: MerchantRole } };
        };
        orderBy?: { createdAt?: 'asc' | 'desc' };
        skip?: number;
        take?: number;
        include?: Record<string, unknown>;
      }) => {
        let rows = [...platformAccounts.values()];
        if (where?.OR?.length) {
          const term = where.OR[0]?.email?.contains?.toLowerCase() ?? '';
          rows = rows.filter(
            (a) =>
              a.email.toLowerCase().includes(term) ||
              (a.firstName ?? '').toLowerCase().includes(term) ||
              (a.lastName ?? '').toLowerCase().includes(term),
          );
        }
        if (where?.customers?.some) {
          rows = rows.filter((a) =>
            [...customers.values()].some((c) => c.accountId === a.id),
          );
        }
        if (where?.merchantUsers?.some?.role) {
          rows = rows.filter((a) =>
            [...users.values()].some(
              (u) => u.accountId === a.id && u.role === where.merchantUsers!.some.role,
            ),
          );
        }
        if (orderBy?.createdAt === 'desc') {
          rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }
        const slice = rows.slice(skip, take === undefined ? undefined : skip + take);
        if (include) {
          return slice.map((account) => ({
            ...account,
            customers: [...customers.values()].filter((c) => c.accountId === account.id),
            merchantUsers: [...users.values()]
              .filter((u) => u.accountId === account.id)
              .map((u) => ({
                ...u,
                tenant: {
                  ...tenants.get(u.tenantId),
                  merchantProfile: (() => {
                    const pid = profileByTenant.get(u.tenantId);
                    return pid ? merchantProfiles.get(pid) : null;
                  })(),
                },
              })),
          }));
        }
        return slice;
      },
      count: async ({ where }: { where?: Record<string, unknown> }) => {
        const rows = await mock.platformAccount.findMany({ where: where as never });
        return rows.length;
      },
      create: async ({
        data,
      }: {
        data: Omit<PlatformAccountRecord, 'id' | 'createdAt' | 'updatedAt'>;
      }) => {
        const record: PlatformAccountRecord = {
          id: nextId('pa'),
          createdAt: now(),
          updatedAt: now(),
          ...data,
          email: data.email.toLowerCase(),
          firstName: data.firstName ?? null,
          lastName: data.lastName ?? null,
          phone: data.phone ?? null,
        };
        platformAccounts.set(record.id, record);
        return record;
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<PlatformAccountRecord>;
      }) => {
        const existing = platformAccounts.get(where.id);
        if (!existing) throw new Error('PlatformAccount not found');
        const updated = { ...existing, ...data, updatedAt: now() };
        platformAccounts.set(where.id, updated);
        return updated;
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
      findUniqueOrThrow: async ({ where }: { where: { id?: string; slug?: string } }) => {
        const tenant = await mock.tenant.findUnique({ where });
        if (!tenant) throw new Error('Tenant not found');
        return tenant;
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
        data: MockCreateInput<
          MerchantProfileRecord,
          'id' | 'createdAt' | 'updatedAt',
          | 'legalName'
          | 'contactPhone'
          | 'rejectionReason'
          | 'submittedAt'
          | 'reviewedAt'
          | 'recruitedByDistributorId'
          | 'recruitedAt'
          | 'pendingRecruitInviteCode'
          | 'storePublished'
        >;
      }) => {
        const record: MerchantProfileRecord = {
          ...data,
          id: nextId('mp'),
          legalName: data.legalName ?? null,
          contactPhone: data.contactPhone ?? null,
          rejectionReason: data.rejectionReason ?? null,
          submittedAt: data.submittedAt ?? null,
          reviewedAt: data.reviewedAt ?? null,
          recruitedByDistributorId: data.recruitedByDistributorId ?? null,
          recruitedAt: data.recruitedAt ?? null,
          pendingRecruitInviteCode: data.pendingRecruitInviteCode ?? null,
          storePublished: data.storePublished ?? false,
          createdAt: now(),
          updatedAt: now(),
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
              users: [...users.values()].filter((u) => u.tenantId === profile!.tenantId),
            };
          }
          return { ...profile, tenant: tenantData };
        }
        return profile;
      },
      findUniqueOrThrow: async ({
        where,
      }: {
        where: { tenantId?: string; id?: string };
      }) => {
        const profile = await mock.merchantProfile.findUnique({ where });
        if (!profile) throw new Error('MerchantProfile not found');
        return profile;
      },
      findMany: async ({
        where,
        skip = 0,
        take = 20,
        orderBy,
        include,
        select,
      }: {
        where?: Record<string, unknown>;
        skip?: number;
        take?: number;
        orderBy?: { createdAt: 'desc' | 'asc' };
        include?: { tenant?: boolean };
        select?: {
          id?: boolean;
          businessName?: boolean;
          contactEmail?: boolean;
          onboardingStatus?: boolean;
          submittedAt?: boolean;
        };
      }) => {
        let items = filterMerchantProfiles([...merchantProfiles.values()], where);
        if (orderBy?.createdAt === 'desc') {
          items = items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        } else if (orderBy?.createdAt === 'asc') {
          items = items.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        }
        items = items.slice(skip, skip + take);
        if (select) {
          return items.map((p) => {
            const row: Record<string, unknown> = {};
            if (select.id) row.id = p.id;
            if (select.businessName) row.businessName = p.businessName;
            if (select.contactEmail) row.contactEmail = p.contactEmail;
            if (select.onboardingStatus) row.onboardingStatus = p.onboardingStatus;
            if (select.submittedAt) row.submittedAt = p.submittedAt;
            return row;
          });
        }
        if (include?.tenant) {
          return items.map((p) => ({
            ...p,
            tenant: tenants.get(p.tenantId),
          }));
        }
        return items;
      },
      count: async ({ where }: { where?: Record<string, unknown> } = {}) => {
        return filterMerchantProfiles([...merchantProfiles.values()], where).length;
      },
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
        where: {
          email?: string;
          id?: string;
          tenantId?: string;
          accountId?: string;
          role?: MerchantRole;
        };
        include?: {
          tenant?: { include?: { merchantProfile?: boolean } };
          account?: boolean;
        };
      }) => {
        let user =
          [...users.values()].find((u) => {
            if (where.email && u.email !== where.email) return false;
            if (where.id && u.id !== where.id) return false;
            if (where.tenantId && u.tenantId !== where.tenantId) return false;
            if (where.accountId && u.accountId !== where.accountId) return false;
            if (where.role && u.role !== where.role) return false;
            return true;
          }) ?? null;
        if (!user) return null;
        let result: Record<string, unknown> = { ...user };
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
          result = { ...result, tenant: tenantData };
        }
        if (include?.account) {
          result = {
            ...result,
            account: platformAccounts.get(user.accountId) ?? null,
          };
        }
        return result as UserRecord & {
          tenant?: Record<string, unknown>;
          account?: PlatformAccountRecord | null;
        };
      },
      findMany: async ({
        where,
        orderBy,
        select,
      }: {
        where?: { tenantId?: string };
        orderBy?: { createdAt?: 'asc' | 'desc' };
        select?: { id?: boolean; email?: boolean; role?: boolean; createdAt?: boolean };
      }) => {
        let items = [...users.values()];
        if (where?.tenantId) items = items.filter((u) => u.tenantId === where.tenantId);
        if (orderBy?.createdAt === 'asc') {
          items = items.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        }
        if (select) {
          return items.map((u) => {
            const row: Record<string, unknown> = {};
            if (select.id) row.id = u.id;
            if (select.email) row.email = u.email;
            if (select.role) row.role = u.role;
            if (select.createdAt) row.createdAt = u.createdAt;
            return row;
          });
        }
        return items;
      },
      findUniqueOrThrow: async ({
        where,
        select,
      }: {
        where: { id: string };
        select?: { id?: boolean; email?: boolean; role?: boolean; createdAt?: boolean };
      }) => {
        const user = users.get(where.id);
        if (!user) throw new Error('User not found');
        if (select) {
          const row: Record<string, unknown> = {};
          if (select.id) row.id = user.id;
          if (select.email) row.email = user.email;
          if (select.role) row.role = user.role;
          if (select.createdAt) row.createdAt = user.createdAt;
          return row;
        }
        return user;
      },
      create: async ({
        data,
        select,
      }: {
        data: Partial<Omit<UserRecord, 'id' | 'createdAt' | 'updatedAt'>> & {
          tenantId: string;
          email: string;
          role: MerchantRole;
          password?: string;
        };
        select?: { id?: boolean; email?: boolean; role?: boolean; createdAt?: boolean };
      }) => {
        let accountId = data.accountId;
        if (!accountId) {
          const existingAccount = [...platformAccounts.values()].find(
            (a) => a.email === data.email,
          );
          if (existingAccount) {
            accountId = existingAccount.id;
          } else {
            const account = await mock.platformAccount.create({
              data: {
                email: data.email,
                password: data.password ?? 'hashed',
                firstName: null,
                lastName: null,
                phone: null,
              },
            });
            accountId = account.id;
          }
        }
        const record: UserRecord = {
          id: nextId('user'),
          createdAt: now(),
          updatedAt: now(),
          tenantId: data.tenantId,
          accountId,
          email: data.email,
          role: data.role,
        };
        users.set(record.id, record);
        if (select) {
          const row: Record<string, unknown> = {};
          if (select.id) row.id = record.id;
          if (select.email) row.email = record.email;
          if (select.role) row.role = record.role;
          if (select.createdAt) row.createdAt = record.createdAt;
          return row as unknown as UserRecord;
        }
        return record;
      },
      update: async ({
        where,
        data,
        select,
      }: {
        where: { id: string };
        data: Partial<UserRecord>;
        select?: { id?: boolean; email?: boolean; role?: boolean; createdAt?: boolean };
      }) => {
        const existing = users.get(where.id);
        if (!existing) throw new Error('User not found');
        const updated = { ...existing, ...data, updatedAt: now() };
        users.set(where.id, updated);
        if (select) {
          const row: Record<string, unknown> = {};
          if (select.id) row.id = updated.id;
          if (select.email) row.email = updated.email;
          if (select.role) row.role = updated.role;
          if (select.createdAt) row.createdAt = updated.createdAt;
          return row;
        }
        return updated;
      },
      delete: async ({ where }: { where: { id: string } }) => {
        const existing = users.get(where.id);
        users.delete(where.id);
        return existing;
      },
    },
    crmCompany: {
      findMany: async ({ where }: { where: { tenantId: string } }) =>
        [...companies.values()].filter((c) => c.tenantId === where.tenantId),
      count: async ({ where }: { where: { tenantId: string } }) =>
        [...companies.values()].filter((c) => c.tenantId === where.tenantId).length,
      findFirst: async ({ where }: { where: { id: string; tenantId: string } }) =>
        [...companies.values()].find((c) => c.id === where.id && c.tenantId === where.tenantId) ??
        null,
      create: async ({
        data,
      }: {
        data: MockCreateInput<CrmCompanyRecord, 'id' | 'createdAt' | 'updatedAt', 'website'>;
      }) => {
        const record: CrmCompanyRecord = {
          ...data,
          id: nextId('co'),
          website: data.website ?? null,
          createdAt: now(),
          updatedAt: now(),
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
      count: async ({ where }: { where: { tenantId: string } }) =>
        [...contacts.values()].filter((c) => c.tenantId === where.tenantId).length,
      findFirst: async ({ where }: { where: { id: string; tenantId: string } }) =>
        [...contacts.values()].find((c) => c.id === where.id && c.tenantId === where.tenantId) ??
        null,
      create: async ({
        data,
      }: {
        data: MockCreateInput<
          CrmContactRecord,
          'id' | 'createdAt' | 'updatedAt',
          'companyId' | 'email' | 'phone'
        >;
      }) => {
        const record: CrmContactRecord = {
          ...data,
          id: nextId('ct'),
          companyId: data.companyId ?? null,
          email: data.email ?? null,
          phone: data.phone ?? null,
          createdAt: now(),
          updatedAt: now(),
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
      count: async ({ where }: { where: { tenantId: string } }) =>
        [...leads.values()].filter((l) => l.tenantId === where.tenantId).length,
      findFirst: async ({ where }: { where: { id: string; tenantId: string } }) =>
        [...leads.values()].find((l) => l.id === where.id && l.tenantId === where.tenantId) ?? null,
      create: async ({
        data,
      }: {
        data: MockCreateInput<
          CrmLeadRecord,
          'id' | 'createdAt' | 'updatedAt' | 'stage',
          'contactId' | 'source' | 'distributorId' | 'stage'
        >;
      }) => {
        const record: CrmLeadRecord = {
          ...data,
          id: nextId('lead'),
          stage: data.stage ?? LeadStage.NEW,
          contactId: data.contactId ?? null,
          source: data.source ?? null,
          distributorId: data.distributorId ?? null,
          createdAt: now(),
          updatedAt: now(),
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
      findMany: async ({
        where,
        orderBy,
        select,
        include,
      }: {
        where?: {
          tenantId?: string;
          email?: string;
          portalEnabled?: boolean;
          isActive?: boolean;
          tenant?: { slug?: string };
        };
        orderBy?: { name: 'asc' | 'desc'; boundAt?: 'desc' };
        select?: { id?: boolean; name?: boolean; isActive?: boolean };
        include?: { tenant?: boolean };
      } = {}) => {
        let items = [...distributors.values()];
        if (where?.tenantId) {
          items = items.filter((d) => d.tenantId === where.tenantId);
        }
        if (where?.email) {
          items = items.filter((d) => d.email === where.email);
        }
        if (where?.portalEnabled !== undefined) {
          items = items.filter((d) => d.portalEnabled === where.portalEnabled);
        }
        if (where?.isActive !== undefined) {
          items = items.filter((d) => d.isActive === where.isActive);
        }
        if (where?.tenant?.slug) {
          items = items.filter((d) => {
            const tenant = d.tenantId ? tenants.get(d.tenantId) : null;
            return tenant?.slug === where.tenant!.slug;
          });
        }
        if (orderBy?.name === 'asc') {
          items = items.sort((a, b) => a.name.localeCompare(b.name));
        } else if (orderBy?.name === 'desc') {
          items = items.sort((a, b) => b.name.localeCompare(a.name));
        }
        if (select) {
          return items.map((d) => {
            const row: Record<string, unknown> = {};
            if (select.id) row.id = d.id;
            if (select.name) row.name = d.name;
            if (select.isActive) row.isActive = d.isActive;
            return row;
          });
        }
        if (include?.tenant) {
          return items.map((d) => ({
            ...d,
            tenant: d.tenantId ? (tenants.get(d.tenantId) ?? null) : null,
          }));
        }
        return items;
      },
      count: async ({ where }: { where?: Record<string, unknown> } = {}) => {
        let items = [...distributors.values()];
        if (where?.tenantId) {
          items = items.filter((d) => d.tenantId === where.tenantId);
        }
        if (where?.isActive !== undefined) {
          items = items.filter((d) => d.isActive === where.isActive);
        }
        return items.length;
      },
      findFirst: async ({
        where,
        include,
      }: {
        where: {
          id?: string;
          tenantId?: string;
          email?: string | { equals: string; mode?: string };
          isActive?: boolean;
          portalEnabled?: boolean;
          tenant?: { slug?: string };
        };
        include?: { tenant?: boolean; qrCodes?: { take?: number } };
      }) => {
        let items = [...distributors.values()];
        if (where.id) items = items.filter((d) => d.id === where.id);
        if (where.tenantId) items = items.filter((d) => d.tenantId === where.tenantId);
        if (where.email) {
          const target =
            typeof where.email === 'string'
              ? where.email
              : where.email.equals.toLowerCase();
          items = items.filter((d) =>
            typeof where.email === 'string'
              ? d.email === where.email
              : d.email?.toLowerCase() === target,
          );
        }
        if (where.isActive !== undefined) {
          items = items.filter((d) => d.isActive === where.isActive);
        }
        if (where.portalEnabled !== undefined) {
          items = items.filter((d) => d.portalEnabled === where.portalEnabled);
        }
        if (where.tenant?.slug) {
          items = items.filter((d) => {
            const tenant = d.tenantId ? tenants.get(d.tenantId) : null;
            return tenant?.slug === where.tenant!.slug;
          });
        }
        const distributor = items[0] ?? null;
        if (!distributor) return null;
        if (include?.qrCodes) {
          const codes = [...qrCodes.values()]
            .filter((q) => q.distributorId === distributor.id)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, include.qrCodes.take ?? 5);
          return { ...distributor, qrCodes: codes };
        }
        if (include?.tenant) {
          return {
            ...distributor,
            tenant: distributor.tenantId ? (tenants.get(distributor.tenantId) ?? null) : null,
          };
        }
        return distributor;
      },
      create: async ({
        data,
      }: {
        data: MockCreateInput<
          DistributorRecord,
          'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'passwordHash' | 'portalEnabled' | 'lastLoginAt',
          'tenantId' | 'email' | 'phone' | 'isActive' | 'passwordHash' | 'portalEnabled' | 'lastLoginAt'
        >;
      }) => {
        const record: DistributorRecord = {
          ...data,
          id: nextId('dist'),
          tenantId: data.tenantId ?? null,
          email: data.email ?? null,
          phone: data.phone ?? null,
          isActive: data.isActive ?? true,
          passwordHash: data.passwordHash ?? null,
          portalEnabled: data.portalEnabled ?? false,
          lastLoginAt: data.lastLoginAt ?? null,
          createdAt: now(),
          updatedAt: now(),
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
          ...data,
          id: nextId('qr'),
          createdAt: now(),
          revokedAt: data.revokedAt ?? null,
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
      findFirst: async ({
        where,
      }: {
        where: { id?: string; distributorId?: string };
      }) => {
        for (const qr of qrCodes.values()) {
          if (where.id && qr.id !== where.id) continue;
          if (where.distributorId && qr.distributorId !== where.distributorId) {
            continue;
          }
          return qr;
        }
        return null;
      },
      findMany: async ({
        where,
        orderBy,
        skip = 0,
        take,
      }: {
        where: {
          distributorId: string;
          bindType?: BindType;
        };
        orderBy?: { createdAt: 'asc' | 'desc' };
        skip?: number;
        take?: number;
      }) => {
        let rows = [...qrCodes.values()].filter((qr) => {
          if (qr.distributorId !== where.distributorId) return false;
          if (where.bindType && qr.bindType !== where.bindType) return false;
          return true;
        });
        if (orderBy?.createdAt === 'desc') {
          rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        } else if (orderBy?.createdAt === 'asc') {
          rows.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        }
        return rows.slice(skip, take === undefined ? undefined : skip + take);
      },
      count: async ({
        where,
      }: {
        where: { distributorId: string; bindType?: BindType };
      }) => {
        return [...qrCodes.values()].filter((qr) => {
          if (qr.distributorId !== where.distributorId) return false;
          if (where.bindType && qr.bindType !== where.bindType) return false;
          return true;
        }).length;
      },
      updateMany: async ({
        where,
        data,
      }: {
        where: {
          distributorId: string;
          bindType?: BindType;
          revokedAt?: null;
          expiresAt?: { gt: Date };
        };
        data: Partial<Pick<DistributorQrCodeRecord, 'revokedAt'>>;
      }) => {
        let count = 0;
        const nowDate = now();
        for (const [id, qr] of qrCodes) {
          if (where.distributorId && qr.distributorId !== where.distributorId) {
            continue;
          }
          if (where.bindType && qr.bindType !== where.bindType) continue;
          if (where.revokedAt === null && qr.revokedAt !== null) continue;
          if (where.expiresAt?.gt && qr.expiresAt <= where.expiresAt.gt) {
            continue;
          }
          qrCodes.set(id, { ...qr, ...data, revokedAt: data.revokedAt ?? nowDate });
          count++;
        }
        return { count };
      },
    },
    customer: {
      findFirst: async ({
        where,
      }: {
        where: { id?: string; tenantId?: string; accountId?: string };
      }) => {
        return (
          [...customers.values()].find((c) => {
            if (where.id && c.id !== where.id) return false;
            if (where.tenantId && c.tenantId !== where.tenantId) return false;
            if (where.accountId && c.accountId !== where.accountId) return false;
            return true;
          }) ?? null
        );
      },
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
        data: Partial<Omit<CustomerRecord, 'id' | 'createdAt' | 'updatedAt'>> & {
          tenantId: string;
          email: string;
          password?: string;
        };
      }) => {
        let accountId = data.accountId;
        if (!accountId) {
          const existingAccount = [...platformAccounts.values()].find(
            (a) => a.email === data.email,
          );
          if (existingAccount) {
            accountId = existingAccount.id;
          } else {
            const account = await mock.platformAccount.create({
              data: {
                email: data.email,
                password: data.password ?? 'hashed',
                firstName: data.firstName ?? null,
                lastName: data.lastName ?? null,
                phone: null,
              },
            });
            accountId = account.id;
          }
        }
        const record: CustomerRecord = {
          id: nextId('cust'),
          createdAt: now(),
          updatedAt: now(),
          tenantId: data.tenantId,
          accountId,
          email: data.email,
          firstName: data.firstName ?? null,
          lastName: data.lastName ?? null,
        };
        customers.set(record.id, record);
        return record;
      },
      count: async ({ where }: { where?: { accountId?: string } }) => {
        let rows = [...customers.values()];
        if (where?.accountId) {
          rows = rows.filter((c) => c.accountId === where.accountId);
        }
        return rows.length;
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
              ...v,
              id: nextId('var'),
              productId: record.id,
              createdAt: now(),
              updatedAt: now(),
              inventory: v.inventory ?? 0,
              reorderThreshold: v.reorderThreshold ?? null,
              isActive: v.isActive ?? true,
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
      findUnique: async ({
        where,
        select,
        include,
      }: {
        where: { id: string };
        select?: { inventory?: boolean };
        include?: { product?: { select?: { tenantId?: boolean } } };
      }) => {
        const variant = productVariants.get(where.id) ?? null;
        if (!variant) return null;
        if (select?.inventory) {
          return { inventory: variant.inventory };
        }
        if (include?.product) {
          const product = products.get(variant.productId);
          return {
            ...variant,
            product: product
              ? { tenantId: product.tenantId }
              : null,
          };
        }
        return variant;
      },
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
      findMany: async ({
        where,
        select,
      }: {
        where?: { product?: { tenantId?: string }; id?: { in: string[] } };
        select?: { id?: boolean; inventory?: boolean; reorderThreshold?: boolean };
      }) => {
        let items = [...productVariants.values()];
        if (where?.product?.tenantId) {
          items = items.filter((v) => {
            const product = products.get(v.productId);
            return product?.tenantId === where.product?.tenantId;
          });
        }
        if (where?.id?.in) {
          items = items.filter((v) => where.id!.in.includes(v.id));
        }
        if (select) {
          return items.map((v) => {
            const row: Record<string, unknown> = {};
            if (select.id) row.id = v.id;
            if (select.inventory) row.inventory = v.inventory;
            if (select.reorderThreshold) row.reorderThreshold = v.reorderThreshold;
            return row;
          });
        }
        return items;
      },
      createMany: async ({
        data,
      }: {
        data: Array<Omit<ProductVariantRecord, 'id' | 'createdAt' | 'updatedAt'>>;
      }) => {
        for (const item of data) {
          const record: ProductVariantRecord = {
            ...item,
            id: nextId('var'),
            createdAt: now(),
            updatedAt: now(),
            reorderThreshold: item.reorderThreshold ?? null,
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
          inventory -= (data.inventory as { decrement: number }).decrement;
        }
        const updated = {
          ...existing,
          ...data,
          inventory,
          reorderThreshold:
            data.reorderThreshold !== undefined
              ? data.reorderThreshold
              : existing.reorderThreshold,
          updatedAt: now(),
        };
        productVariants.set(where.id, updated);
        return updated;
      },
    },
    tenantInventorySettings: {
      findUnique: async ({ where }: { where: { tenantId: string } }) =>
        inventorySettings.get(where.tenantId) ?? null,
      findUniqueOrThrow: async ({ where }: { where: { tenantId: string } }) => {
        const settings = inventorySettings.get(where.tenantId);
        if (!settings) throw new Error('Settings not found');
        return settings;
      },
      upsert: async ({
        where,
        create,
        update,
      }: {
        where: { tenantId: string };
        create: Omit<TenantInventorySettingsRecord, 'createdAt' | 'updatedAt'>;
        update: Partial<TenantInventorySettingsRecord>;
      }) => {
        const existing = inventorySettings.get(where.tenantId);
        if (existing) {
          const updated = { ...existing, ...update, updatedAt: now() };
          inventorySettings.set(where.tenantId, updated);
          return updated;
        }
        const record: TenantInventorySettingsRecord = {
          createdAt: now(),
          updatedAt: now(),
          ...create,
        };
        inventorySettings.set(record.tenantId, record);
        return record;
      },
    },
    tenantSettings: {
      findUnique: async ({ where }: { where: { tenantId: string } }) =>
        tenantSettings.get(where.tenantId) ?? null,
      create: async ({
        data,
      }: {
        data: Omit<TenantSettingsRecord, 'createdAt' | 'updatedAt'>;
      }) => {
        const record: TenantSettingsRecord = {
          ...data,
          createdAt: now(),
          updatedAt: now(),
          defaultCommissionRate: data.defaultCommissionRate ?? null,
          defaultCommissionType: data.defaultCommissionType ?? null,
          notifyOnBinding: data.notifyOnBinding ?? true,
          notifyOnCommission: data.notifyOnCommission ?? true,
        };
        tenantSettings.set(record.tenantId, record);
        return record;
      },
      update: async ({
        where,
        data,
      }: {
        where: { tenantId: string };
        data: Partial<TenantSettingsRecord>;
      }) => {
        const existing = tenantSettings.get(where.tenantId);
        if (!existing) throw new Error('TenantSettings not found');
        const updated = { ...existing, ...data, updatedAt: now() };
        tenantSettings.set(where.tenantId, updated);
        return updated;
      },
      upsert: async ({
        where,
        create,
        update,
      }: {
        where: { tenantId: string };
        create: Omit<TenantSettingsRecord, 'createdAt' | 'updatedAt'>;
        update: Partial<TenantSettingsRecord>;
      }) => {
        const existing = tenantSettings.get(where.tenantId);
        if (existing) {
          const updated = { ...existing, ...update, updatedAt: now() };
          tenantSettings.set(where.tenantId, updated);
          return updated;
        }
        const record: TenantSettingsRecord = {
          ...create,
          createdAt: now(),
          updatedAt: now(),
          defaultCommissionRate: create.defaultCommissionRate ?? null,
          defaultCommissionType: create.defaultCommissionType ?? null,
          notifyOnBinding: create.notifyOnBinding ?? true,
          notifyOnCommission: create.notifyOnCommission ?? true,
        };
        tenantSettings.set(record.tenantId, record);
        return record;
      },
    },
    platformSettings: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        platformSettings.get(where.id) ?? null,
      upsert: async ({
        where,
        create,
        update,
      }: {
        where: { id: string };
        create: Omit<PlatformSettingsRecord, 'updatedAt'>;
        update: Partial<PlatformSettingsRecord>;
      }) => {
        const existing = platformSettings.get(where.id);
        if (existing) {
          const updated = { ...existing, ...update, updatedAt: now() };
          platformSettings.set(where.id, updated);
          return updated;
        }
        const record: PlatformSettingsRecord = {
          ...create,
          platformName: create.platformName ?? 'MeridianERP',
          supportEmail: create.supportEmail ?? null,
          distributorPortalEnabled: create.distributorPortalEnabled ?? true,
          emailQueueEnabled: create.emailQueueEnabled ?? true,
          updatedAt: now(),
        };
        platformSettings.set(record.id, record);
        return record;
      },
    },
    warehouse: {
      findMany: async ({
        where,
        include,
        orderBy,
      }: {
        where: { tenantId?: string };
        include?: { stockLevels?: { select?: Record<string, boolean> } };
        orderBy?: Array<{ isDefault?: 'desc' | 'asc'; name?: 'asc' }>;
      }) => {
        let items = [...warehouses.values()];
        if (where.tenantId) items = items.filter((w) => w.tenantId === where.tenantId);
        if (orderBy) {
          for (const ob of orderBy) {
            if (ob.isDefault) {
              items = items.sort((a, b) =>
                ob.isDefault === 'desc'
                  ? Number(b.isDefault) - Number(a.isDefault)
                  : Number(a.isDefault) - Number(b.isDefault),
              );
            }
            if (ob.name) {
              items = items.sort((a, b) => a.name.localeCompare(b.name));
            }
          }
        }
        return items.map((w) => {
          const row: Record<string, unknown> = { ...w };
          if (include?.stockLevels) {
            row.stockLevels = [...stockLevels.values()]
              .filter((sl) => sl.warehouseId === w.id)
              .map((sl) => ({ quantityOnHand: sl.quantityOnHand, variantId: sl.variantId }));
          }
          return row;
        });
      },
      findFirst: async ({
        where,
      }: {
        where: {
          id?: string;
          tenantId?: string;
          isDefault?: boolean;
          isActive?: boolean;
        };
      }) => {
        let items = [...warehouses.values()];
        if (where.id) items = items.filter((w) => w.id === where.id);
        if (where.tenantId) items = items.filter((w) => w.tenantId === where.tenantId);
        if (where.isDefault !== undefined) {
          items = items.filter((w) => w.isDefault === where.isDefault);
        }
        if (where.isActive !== undefined) {
          items = items.filter((w) => w.isActive === where.isActive);
        }
        return items[0] ?? null;
      },
      create: async ({
        data,
      }: {
        data: Omit<WarehouseRecord, 'id' | 'createdAt' | 'updatedAt'>;
      }) => {
        const record: WarehouseRecord = {
          ...data,
          id: nextId('wh'),
          createdAt: now(),
          updatedAt: now(),
          address: data.address ?? null,
          isDefault: data.isDefault ?? false,
          isActive: data.isActive ?? true,
        };
        warehouses.set(record.id, record);
        return record;
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<WarehouseRecord>;
      }) => {
        const existing = warehouses.get(where.id);
        if (!existing) throw new Error('Warehouse not found');
        const updated = { ...existing, ...data, updatedAt: now() };
        warehouses.set(where.id, updated);
        return updated;
      },
      updateMany: async ({
        where,
        data,
      }: {
        where: { tenantId?: string; isDefault?: boolean };
        data: Partial<WarehouseRecord>;
      }) => {
        let count = 0;
        for (const [id, w] of warehouses) {
          if (where.tenantId && w.tenantId !== where.tenantId) continue;
          if (where.isDefault !== undefined && w.isDefault !== where.isDefault) continue;
          warehouses.set(id, { ...w, ...data, updatedAt: now() });
          count++;
        }
        return { count };
      },
    },
    stockLevel: {
      findMany: async ({
        where,
        skip,
        take,
        include,
        orderBy,
      }: {
        where: Record<string, unknown>;
        skip?: number;
        take?: number;
        include?: Record<string, unknown>;
        orderBy?: { updatedAt?: 'desc' };
      }) => {
        let items = filterStockLevels(where);
        if (orderBy?.updatedAt === 'desc') {
          items = items.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        }
        if (skip !== undefined && take !== undefined) {
          items = items.slice(skip, skip + take);
        }
        return items.map((sl) => attachStockLevel(sl, include));
      },
      count: async ({ where }: { where: Record<string, unknown> }) =>
        filterStockLevels(where).length,
      findUnique: async ({
        where,
      }: {
        where: { warehouseId_variantId: { warehouseId: string; variantId: string } };
      }) => {
        const { warehouseId, variantId } = where.warehouseId_variantId;
        return (
          [...stockLevels.values()].find(
            (sl) => sl.warehouseId === warehouseId && sl.variantId === variantId,
          ) ?? null
        );
      },
      upsert: async ({
        where,
        create,
        update,
      }: {
        where: { warehouseId_variantId: { warehouseId: string; variantId: string } };
        create: Omit<StockLevelRecord, 'id' | 'createdAt' | 'updatedAt'>;
        update: Partial<StockLevelRecord>;
      }) => {
        const existing = await mock.stockLevel.findUnique({ where });
        if (existing) {
          const updated = { ...existing, ...update, updatedAt: now() };
          stockLevels.set(existing.id, updated);
          return updated;
        }
        const record: StockLevelRecord = {
          id: nextId('sl'),
          createdAt: now(),
          updatedAt: now(),
          ...create,
        };
        stockLevels.set(record.id, record);
        return record;
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<StockLevelRecord>;
      }) => {
        const existing = stockLevels.get(where.id);
        if (!existing) throw new Error('Stock level not found');
        const updated = { ...existing, ...data, updatedAt: now() };
        stockLevels.set(where.id, updated);
        return updated;
      },
    },
    stockAdjustment: {
      findMany: async ({
        where,
        skip,
        take,
        orderBy,
        include,
      }: {
        where: Record<string, unknown>;
        skip?: number;
        take?: number;
        orderBy?: { createdAt: 'desc' };
        include?: Record<string, unknown>;
      }) => {
        let items = filterAdjustments(where);
        if (orderBy?.createdAt === 'desc') {
          items = items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }
        if (skip !== undefined && take !== undefined) {
          items = items.slice(skip, skip + take);
        }
        return items.map((a) => attachAdjustment(a, include));
      },
      count: async ({ where }: { where: Record<string, unknown> }) =>
        filterAdjustments(where).length,
      create: async ({
        data,
        include,
      }: {
        data: Omit<StockAdjustmentRecord, 'id' | 'createdAt'>;
        include?: Record<string, unknown>;
      }) => {
        const record: StockAdjustmentRecord = {
          id: nextId('adj'),
          createdAt: now(),
          ...data,
        };
        stockAdjustments.set(record.id, record);
        return attachAdjustment(record, include);
      },
    },
    stockTransfer: {
      findMany: async ({
        where,
        skip,
        take,
        orderBy,
        include,
      }: {
        where: Record<string, unknown>;
        skip?: number;
        take?: number;
        orderBy?: { createdAt: 'desc' };
        include?: Record<string, unknown>;
      }) => {
        let items = filterStockTransfers(where);
        if (orderBy?.createdAt === 'desc') {
          items = items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }
        if (skip !== undefined && take !== undefined) {
          items = items.slice(skip, skip + take);
        }
        return items.map((t) => attachStockTransfer(t, include));
      },
      findFirst: async ({
        where,
        include,
      }: {
        where: Record<string, unknown>;
        include?: Record<string, unknown>;
      }) => {
        const transfer = filterStockTransfers(where)[0];
        if (!transfer) return null;
        return attachStockTransfer(transfer, include);
      },
      count: async ({ where }: { where: Record<string, unknown> }) =>
        filterStockTransfers(where).length,
      create: async ({
        data,
        include,
      }: {
        data: Omit<StockTransferRecord, 'id' | 'createdAt'> & {
          lines?: { create: Array<Omit<StockTransferLineRecord, 'id' | 'transferId'>> };
        };
        include?: Record<string, unknown>;
      }) => {
        const { lines, ...transferData } = data;
        const record: StockTransferRecord = {
          id: nextId('st'),
          createdAt: now(),
          ...transferData,
        };
        stockTransfers.set(record.id, record);
        if (lines?.create) {
          for (const line of lines.create) {
            const transferLine: StockTransferLineRecord = {
              id: nextId('stl'),
              transferId: record.id,
              ...line,
            };
            stockTransferLines.set(transferLine.id, transferLine);
          }
        }
        return attachStockTransfer(record, include);
      },
    },
    purchaseOrder: {
      findMany: async ({
        where,
        skip,
        take,
        orderBy,
        include,
      }: {
        where: Record<string, unknown>;
        skip?: number;
        take?: number;
        orderBy?: { createdAt: 'desc' };
        include?: Record<string, unknown>;
      }) => {
        let items = filterPurchaseOrders(where);
        if (orderBy?.createdAt === 'desc') {
          items = items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }
        if (skip !== undefined && take !== undefined) {
          items = items.slice(skip, skip + take);
        }
        return items.map((po) => attachPurchaseOrder(po, include));
      },
      findFirst: async ({
        where,
        include,
      }: {
        where: Record<string, unknown>;
        include?: Record<string, unknown>;
      }) => {
        const po = filterPurchaseOrders(where)[0];
        if (!po) return null;
        return attachPurchaseOrder(po, include);
      },
      count: async ({ where }: { where: Record<string, unknown> }) =>
        filterPurchaseOrders(where).length,
      create: async ({
        data,
        include,
      }: {
        data: Omit<PurchaseOrderRecord, 'id' | 'createdAt' | 'updatedAt'> & {
          lines?: { create: Array<Omit<PurchaseOrderLineRecord, 'id' | 'purchaseOrderId' | 'createdAt' | 'updatedAt' | 'quantityReceived'>> };
        };
        include?: Record<string, unknown>;
      }) => {
        const { lines, ...poData } = data;
        const record: PurchaseOrderRecord = {
          ...poData,
          id: nextId('po'),
          createdAt: now(),
          updatedAt: now(),
          orderedAt: poData.orderedAt ?? null,
        };
        purchaseOrders.set(record.id, record);
        if (lines?.create) {
          for (const line of lines.create) {
            const poLine: PurchaseOrderLineRecord = {
              id: nextId('pol'),
              purchaseOrderId: record.id,
              quantityReceived: 0,
              createdAt: now(),
              updatedAt: now(),
              ...line,
            };
            purchaseOrderLines.set(poLine.id, poLine);
          }
        }
        return attachPurchaseOrder(record, include);
      },
      update: async ({
        where,
        data,
        include,
      }: {
        where: { id: string };
        data: Partial<PurchaseOrderRecord>;
        include?: Record<string, unknown>;
      }) => {
        const existing = purchaseOrders.get(where.id);
        if (!existing) throw new Error('PO not found');
        const updated = { ...existing, ...data, updatedAt: now() };
        purchaseOrders.set(where.id, updated);
        return attachPurchaseOrder(updated, include);
      },
    },
    purchaseOrderLine: {
      findMany: async ({ where }: { where: { purchaseOrderId?: string } }) => {
        let items = [...purchaseOrderLines.values()];
        if (where.purchaseOrderId) {
          items = items.filter((l) => l.purchaseOrderId === where.purchaseOrderId);
        }
        return items;
      },
      deleteMany: async ({ where }: { where: { purchaseOrderId: string } }) => {
        let count = 0;
        for (const [id, line] of purchaseOrderLines) {
          if (line.purchaseOrderId === where.purchaseOrderId) {
            purchaseOrderLines.delete(id);
            count++;
          }
        }
        return { count };
      },
      createMany: async ({
        data,
      }: {
        data: Array<Omit<PurchaseOrderLineRecord, 'id' | 'createdAt' | 'updatedAt' | 'quantityReceived'>>;
      }) => {
        for (const item of data) {
          const record: PurchaseOrderLineRecord = {
            id: nextId('pol'),
            quantityReceived: 0,
            createdAt: now(),
            updatedAt: now(),
            ...item,
          };
          purchaseOrderLines.set(record.id, record);
        }
        return { count: data.length };
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<PurchaseOrderLineRecord>;
      }) => {
        const existing = purchaseOrderLines.get(where.id);
        if (!existing) throw new Error('PO line not found');
        const updated = { ...existing, ...data, updatedAt: now() };
        purchaseOrderLines.set(where.id, updated);
        return updated;
      },
    },
    purchaseOrderReceipt: {
      create: async ({
        data,
        include,
      }: {
        data: Omit<PurchaseOrderReceiptRecord, 'id' | 'createdAt'> & {
          lines?: { create: Array<{ purchaseOrderLineId: string; quantityReceived: number }> };
        };
        include?: { lines?: boolean };
      }) => {
        const { lines, ...receiptData } = data;
        const record: PurchaseOrderReceiptRecord = {
          id: nextId('por'),
          createdAt: now(),
          ...receiptData,
        };
        purchaseOrderReceipts.set(record.id, record);
        const createdLines: PurchaseOrderReceiptLineRecord[] = [];
        if (lines?.create) {
          for (const line of lines.create) {
            const rl: PurchaseOrderReceiptLineRecord = {
              id: nextId('porl'),
              receiptId: record.id,
              ...line,
            };
            purchaseOrderReceiptLines.set(rl.id, rl);
            createdLines.push(rl);
          }
        }
        return include?.lines ? { ...record, lines: createdLines } : record;
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
          ...data,
          id: nextId('cart'),
          createdAt: now(),
          updatedAt: now(),
          customerId: data.customerId ?? null,
          sessionId: data.sessionId ?? null,
          distributorId: data.distributorId ?? null,
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
        select,
        skip,
        take,
        orderBy,
      }: {
        where?: Record<string, unknown>;
        include?: Record<string, unknown>;
        select?: Record<string, unknown>;
        skip?: number;
        take?: number;
        orderBy?: { createdAt: 'desc' | 'asc' };
      }) => {
        let items = filterOrders(where ?? {});
        if (orderBy?.createdAt === 'desc') {
          items = items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }
        if (orderBy?.createdAt === 'asc') {
          items = items.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        }
        if (skip !== undefined && take !== undefined) {
          items = items.slice(skip, skip + take);
        }
        if (select) {
          return items.map((o) => applyOrderSelect(o, select));
        }
        return items.map((o) => attachOrder(o, include));
      },
      findFirst: async ({
        where,
        include,
      }: {
        where: { id?: string; tenantId?: string; customerId?: string };
        include?: Record<string, unknown>;
      }) => {
        const items = filterOrders(where);
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
        data: MockCreateInput<
          OrderRecord,
          'id' | 'createdAt' | 'updatedAt' | 'status' | 'currency',
          | 'customerId'
          | 'guestEmail'
          | 'stripePaymentIntentId'
          | 'distributorId'
          | 'status'
          | 'currency'
          | 'createdAt'
          | 'updatedAt'
        > & {
          lines?: {
            create: Array<Omit<OrderLineRecord, 'id' | 'orderId'>>;
          };
        };
        include?: Record<string, unknown>;
      }) => {
        const { lines, ...orderData } = data;
        const record: OrderRecord = {
          ...orderData,
          id: nextId('ord'),
          status: orderData.status ?? OrderStatus.PENDING_PAYMENT,
          currency: orderData.currency ?? 'USD',
          createdAt: orderData.createdAt ?? now(),
          updatedAt: orderData.updatedAt ?? now(),
          stripePaymentIntentId: orderData.stripePaymentIntentId ?? null,
          guestEmail: orderData.guestEmail ?? null,
          distributorId: orderData.distributorId ?? null,
          customerId: orderData.customerId ?? null,
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
      count: async ({ where }: { where?: Record<string, unknown> }) =>
        filterOrders(where ?? {}).length,
      groupBy: async ({
        by,
        where,
        _count,
      }: {
        by: ['distributorId'];
        where?: Record<string, unknown>;
        _count?: true | { _all?: boolean };
      }) => {
        const items = filterOrders(where ?? {});
        const counts = new Map<string | null, number>();
        for (const order of items) {
          const key = order.distributorId;
          counts.set(key, (counts.get(key) ?? 0) + 1);
        }
        return [...counts.entries()].map(([distributorId, count]) => ({
          distributorId,
          _count: _count ? count : undefined,
        }));
      },
      aggregate: async ({
        where,
        _count,
        _sum,
      }: {
        where?: Record<string, unknown>;
        _count?: { _all?: boolean };
        _sum?: { total?: boolean };
      }) => {
        const items = filterOrders(where ?? {});
        const result: {
          _count?: { _all: number };
          _sum?: { total: Prisma.Decimal | null };
        } = {};
        if (_count?._all) {
          result._count = { _all: items.length };
        }
        if (_sum?.total) {
          const total = items.reduce(
            (acc, o) => acc.plus(o.total),
            new Prisma.Decimal(0),
          );
          result._sum = { total: items.length ? total : null };
        }
        return result;
      },
    },
    commissionLedger: {
      findMany: async ({
        where,
        include,
        skip,
        take,
        orderBy,
      }: {
        where?: Record<string, unknown>;
        include?: Record<string, unknown>;
        skip?: number;
        take?: number;
        orderBy?: { createdAt: 'desc' | 'asc' };
      }) => {
        let items = filterCommissionLedgers(where ?? {});
        if (where?.orderId) {
          items = items.filter((e) => e.orderId === where.orderId);
        }
        if (orderBy?.createdAt === 'desc') {
          items = items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }
        if (skip !== undefined && take !== undefined) {
          items = items.slice(skip, skip + take);
        }
        return items.map((e) => attachCommissionEntry(e, include));
      },
      count: async ({ where }: { where?: Record<string, unknown> }) =>
        filterCommissionLedgers(where ?? {}).length,
      aggregate: async ({
        where,
        _sum,
      }: {
        where?: Record<string, unknown>;
        _sum?: { amount?: boolean };
      }) => {
        const items = filterCommissionLedgers(where ?? {});
        const result: { _sum?: { amount: Prisma.Decimal | null } } = {};
        if (_sum?.amount) {
          const amount = items.reduce(
            (acc, e) => acc.plus(e.amount),
            new Prisma.Decimal(0),
          );
          result._sum = { amount: items.length ? amount : null };
        }
        return result;
      },
      create: async ({
        data,
      }: {
        data: MockCreateInput<
          CommissionLedgerRecord,
          'id' | 'createdAt' | 'updatedAt' | 'settledAt' | 'settlementBatchId',
          'status' | 'createdAt' | 'updatedAt'
        >;
      }) => {
        const record: CommissionLedgerRecord = {
          ...data,
          id: nextId('cl'),
          settlementBatchId: null,
          settledAt: null,
          status: data.status ?? LedgerStatus.ACCRUED,
          createdAt: data.createdAt ?? now(),
          updatedAt: data.updatedAt ?? now(),
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
        data: Omit<SettlementBatchRecord, 'id' | 'createdAt' | 'updatedAt' | 'exportedAt'> & {
          exportedAt?: Date | null;
        };
      }) => {
        const record: SettlementBatchRecord = {
          ...data,
          id: nextId('sb'),
          exportedAt: data.exportedAt ?? null,
          createdAt: now(),
          updatedAt: now(),
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
        include,
        orderBy,
      }: {
        where?: Record<string, unknown>;
        include?: Record<string, unknown>;
        orderBy?: { boundAt?: 'desc' | 'asc' };
      }) => {
        let items = filterBindings(where ?? {});
        if (orderBy?.boundAt === 'desc') {
          items = items.sort((a, b) => b.boundAt.getTime() - a.boundAt.getTime());
        }
        return items.map((binding) => attachBinding(binding, include));
      },
      count: async ({ where }: { where?: Record<string, unknown> }) =>
        filterBindings(where ?? {}).length,
      groupBy: async ({
        by,
        where,
        _count,
      }: {
        by: ['distributorId'];
        where?: Record<string, unknown>;
        _count?: true | { _all?: boolean };
      }) => {
        const items = filterBindings(where ?? {});
        const counts = new Map<string, number>();
        for (const binding of items) {
          counts.set(binding.distributorId, (counts.get(binding.distributorId) ?? 0) + 1);
        }
        return [...counts.entries()].map(([distributorId, count]) => ({
          distributorId,
          _count: _count ? count : undefined,
        }));
      },
      create: async ({
        data,
      }: {
        data: Omit<BindingRecord, 'id' | 'boundAt'> & { boundAt?: Date };
      }) => {
        const record: BindingRecord = {
          id: nextId('bind'),
          boundAt: data.boundAt ?? now(),
          ...data,
        };
        bindings.set(record.id, record);
        return record;
      },
    },
    masterSku: {
      findMany: async () => [],
      findUnique: async () => null,
      findFirst: async () => null,
      create: async ({ data }: { data: Record<string, unknown> }) => ({
        id: nextId('msku'),
        cumulativeShippedQty: 0,
        isActive: true,
        createdAt: now(),
        updatedAt: now(),
        ...data,
      }),
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Record<string, unknown>;
      }) => ({ id: where.id, ...data }),
      count: async () => 0,
    },
    allocationOrder: {
      findMany: async () => [],
      findUnique: async () => null,
      findFirst: async () => null,
      create: async ({ data, include }: { data: Record<string, unknown>; include?: unknown }) => {
        const record = {
          id: nextId('alloc'),
          status: 'DRAFT',
          createdAt: now(),
          updatedAt: now(),
          lines: [],
          ...data,
        };
        return record;
      },
      update: async ({
        where,
        data,
        include,
      }: {
        where: { id: string };
        data: Record<string, unknown>;
        include?: unknown;
      }) => ({ id: where.id, lines: [], ...data }),
    },
    allocationOrderLine: {
      findMany: async () => [],
      aggregate: async () => ({ _sum: { wholesalePrice: null } }),
    },
    replenishmentRequest: {
      findMany: async () => [],
      findUnique: async () => null,
      create: async ({ data, include }: { data: Record<string, unknown>; include?: unknown }) => ({
        id: nextId('repl'),
        status: 'PENDING',
        lines: [],
        createdAt: now(),
        updatedAt: now(),
        ...data,
      }),
      update: async ({
        where,
        data,
        include,
      }: {
        where: { id: string };
        data: Record<string, unknown>;
        include?: unknown;
      }) => ({ id: where.id, lines: [], ...data }),
    },
    replenishmentRequestLine: {
      create: async () => ({}),
    },
    deliveryAllocationLedger: {
      aggregate: async () => ({ _sum: { lineTotal: null } }),
    },
    withdrawalRequest: {
      aggregate: async () => ({ _sum: { amount: null } }),
      findMany: async () => [],
      findFirst: async () => null,
      create: async ({ data }: { data: Record<string, unknown> }) => ({
        id: nextId('wd'),
        status: 'PENDING',
        createdAt: now(),
        ...data,
      }),
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Record<string, unknown>;
      }) => ({ id: where.id, ...data }),
    },
    merchantRecruitInviteCode: {
      findMany: async () => [],
      findFirst: async () => null,
      findUnique: async () => null,
      create: async ({ data }: { data: Record<string, unknown> }) => ({
        id: nextId('inv'),
        useCount: 0,
        createdAt: now(),
        ...data,
      }),
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Record<string, unknown>;
      }) => ({ id: where.id, ...data }),
    },
    recruiterChangeLog: {
      create: async ({ data }: { data: Record<string, unknown> }) => ({
        id: nextId('rcl'),
        createdAt: now(),
        ...data,
      }),
    },
    platformCrmCompany: {
      findMany: async () => [],
      findUnique: async () => null,
      create: async ({ data }: { data: Record<string, unknown> }) => ({
        id: nextId('pcc'),
        createdAt: now(),
        updatedAt: now(),
        ...data,
      }),
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Record<string, unknown>;
      }) => ({ id: where.id, ...data }),
      delete: async () => ({}),
    },
    platformCrmContact: {
      findMany: async () => [],
      findUnique: async () => null,
      create: async ({ data }: { data: Record<string, unknown> }) => ({
        id: nextId('pcct'),
        createdAt: now(),
        updatedAt: now(),
        ...data,
      }),
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Record<string, unknown>;
      }) => ({ id: where.id, ...data }),
      delete: async () => ({}),
    },
    platformCrmLead: {
      findMany: async () => [],
      findUnique: async () => null,
      create: async ({ data }: { data: Record<string, unknown> }) => ({
        id: nextId('pcl'),
        stage: 'NEW',
        createdAt: now(),
        updatedAt: now(),
        ...data,
      }),
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Record<string, unknown>;
      }) => ({ id: where.id, ...data }),
      delete: async () => ({}),
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
          storePublished: true,
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
    _expireQrToken: (token: string) => {
      const id = qrByToken.get(token);
      if (!id) return;
      const qr = qrCodes.get(id);
      if (!qr) return;
      qrCodes.set(id, { ...qr, expiresAt: new Date(0) });
    },
  };

  return mock;
}

export type MockPrisma = ReturnType<typeof createMockPrisma>;
