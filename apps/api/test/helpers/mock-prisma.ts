import {
  ActivityType,
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
  WithdrawalRequestStatus,
} from '@prisma/client';

enum BindType {
  MERCHANT = 'MERCHANT',
  CUSTOMER = 'CUSTOMER',
}

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
  const customers = new Map<Id, CustomerRecord>();
  const categories = new Map<Id, CategoryRecord>();
  const products = new Map<Id, ProductRecord>();
  const productVariants = new Map<Id, ProductVariantRecord>();
  const carts = new Map<Id, CartRecord>();
  const cartItems = new Map<Id, CartItemRecord>();
  const orders = new Map<Id, OrderRecord>();
  const orderLines = new Map<Id, OrderLineRecord>();
  const commissionLedgers = new Map<Id, CommissionLedgerRecord>();
  const allocationOrders = new Map<Id, AllocationOrderRecord>();
  const settlementBatches = new Map<Id, SettlementBatchRecord>();
  const inventorySettings = new Map<Id, TenantInventorySettingsRecord>();
  const tenantSettings = new Map<Id, TenantSettingsRecord>();
  const platformSettings = new Map<Id, PlatformSettingsRecord>();
  const pluginDefinitions = new Map<Id, PluginDefinitionRecord>();
  const tenantPlugins = new Map<Id, TenantPluginRecord>();
  const warehouses = new Map<Id, WarehouseRecord>();
  const stockLevels = new Map<Id, StockLevelRecord>();
  const stockAdjustments = new Map<Id, StockAdjustmentRecord>();
  const purchaseOrders = new Map<Id, PurchaseOrderRecord>();
  const purchaseOrderLines = new Map<Id, PurchaseOrderLineRecord>();
  const purchaseOrderReceipts = new Map<Id, PurchaseOrderReceiptRecord>();
  const purchaseOrderReceiptLines = new Map<
    Id,
    PurchaseOrderReceiptLineRecord
  >();
  const stockTransfers = new Map<Id, StockTransferRecord>();
  const stockTransferLines = new Map<Id, StockTransferLineRecord>();
  const merchantRecruitInviteCodes = new Map<
    Id,
    MerchantRecruitInviteCodeRecord
  >();
  const withdrawalRequests = new Map<Id, WithdrawalRequestRecord>();
  const masterSkus = new Map<Id, MasterSkuRecord>();
  const branchPurchaseOrders = new Map<Id, BranchPurchaseOrderRecord>();
  const procurementReceivingAddresses = new Map<Id, ProcurementReceivingAddressRecord>();
  const customerDeliveryAddresses = new Map<Id, CustomerDeliveryAddressRecord>();
  const branchPurchaseOrderPayments = new Map<Id, BranchPurchaseOrderPaymentRecord>();

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
    operationalFrozen: boolean;
    isFlagship: boolean;
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
    accountId: Id | null;
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
    masterSkuId: Id | null;
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
    orderId: Id | null;
    allocationOrderId: Id | null;
    distributorId: Id;
    customerId: Id | null;
    customerOrderSequence: number | null;
    merchantAllocationSequence: number | null;
    commissionSource: string | null;
    amount: Prisma.Decimal;
    status: LedgerStatus;
    settlementBatchId: string | null;
    settledAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }

  interface AllocationOrderLineRecord {
    id: Id;
    allocationOrderId: Id;
    masterSkuId: Id;
    quantity: number;
    wholesalePrice: Prisma.Decimal;
  }

  interface BranchPurchaseOrderLineRecord {
    id: Id;
    branchPurchaseOrderId: Id;
    masterSkuId: Id;
    quantityOrdered: number;
    quantityReceived: number;
    unitWholesalePrice: Prisma.Decimal;
  }

  interface BranchPurchaseOrderRecord {
    id: Id;
    tenantId: Id;
    warehouseId: Id;
    orderNumber: string;
    status: string;
    totalAmount: Prisma.Decimal;
    note: string | null;
    paidAt: Date | null;
    allocationOrderId: Id | null;
    receivingAddressId: Id | null;
    receivingAddressSnapshot: Record<string, string> | null;
    createdById: Id;
    lines: BranchPurchaseOrderLineRecord[];
    createdAt: Date;
    updatedAt: Date;
  }

  interface ProcurementReceivingAddressRecord {
    id: Id;
    tenantId: Id;
    label: string;
    contactName: string;
    contactPhone: string;
    address: string;
    isDefault: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }

  interface CustomerDeliveryAddressRecord {
    id: Id;
    accountId: Id;
    label: string | null;
    name: string;
    phone: string;
    line1: string;
    line2: string | null;
    city: string;
    province: string | null;
    postalCode: string | null;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
  }

  interface BranchPurchaseOrderPaymentRecord {
    id: Id;
    branchPurchaseOrderId: Id;
    amount: Prisma.Decimal;
    status: string;
    provider: string;
    paidAt: Date | null;
    createdAt: Date;
  }

  interface AllocationOrderRecord {
    id: Id;
    tenantId: Id;
    status: string;
    issuedAt: Date | null;
    confirmedAt: Date | null;
    lines: AllocationOrderLineRecord[];
    createdAt: Date;
    updatedAt: Date;
  }

  interface MerchantRecruitInviteCodeRecord {
    id: Id;
    code: string;
    distributorId: Id;
    revokedAt: Date | null;
    expiresAt: Date | null;
    useCount: number;
    createdAt: Date;
  }

  interface WithdrawalRequestRecord {
    id: Id;
    distributorId: Id;
    amount: Prisma.Decimal;
    status: WithdrawalRequestStatus;
    note: string | null;
    reviewedByPlatformUserId: string | null;
    rejectionReason: string | null;
    reviewedAt: Date | null;
    payoutProvider: string | null;
    payoutReference: string | null;
    disbursedAt: Date | null;
    payoutError: string | null;
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
    deliveryFlatFee: Prisma.Decimal;
    createdAt: Date;
    updatedAt: Date;
  }

  interface PlatformSettingsRecord {
    id: Id;
    platformName: string;
    supportEmail: string | null;
    distributorPortalEnabled: boolean;
    emailQueueEnabled: boolean;
    maxRetailPriceDeviationPercent: number;
    updatedAt: Date;
  }

  interface PluginDefinitionRecord {
    id: Id;
    code: string;
    category: string;
    icon: string;
    sortOrder: number;
    nameKey: string;
    descriptionKey: string;
    navRoutes: unknown;
    status: 'ACTIVE' | 'COMING_SOON' | 'DEPRECATED';
    isDefaultOnSignup: boolean;
    createdAt: Date;
    updatedAt: Date;
  }

  interface TenantPluginRecord {
    id: Id;
    tenantId: Id;
    pluginId: Id;
    status: 'INSTALLED' | 'UNINSTALLED';
    installedAt: Date;
    uninstalledAt: Date | null;
    installedByUserId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }

  interface MasterSkuRecord {
    id: Id;
    skuCode: string;
    name: string;
    quantityOnHand: number;
    cumulativeShippedQty: number;
    unitCost: Prisma.Decimal;
    wholesalePrice: Prisma.Decimal;
    retailPrice: Prisma.Decimal;
    flagshipPrice: Prisma.Decimal;
    isActive: boolean;
    createdAt: Date;
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

  const attachBranchPurchaseOrderIncludes = (
    order: BranchPurchaseOrderRecord,
    include?: {
      lines?: boolean | { include?: { masterSku?: boolean } };
      payment?: boolean;
    },
  ) => {
    const result: Record<string, unknown> = { ...order };
    if (include?.lines) {
      const withMasterSku =
        typeof include.lines === 'object' && include.lines.include?.masterSku;
      result.lines = order.lines.map((line) => {
        const lineResult: Record<string, unknown> = { ...line };
        if (withMasterSku) {
          const sku = masterSkus.get(line.masterSkuId);
          lineResult.masterSku = sku ?? {
            id: line.masterSkuId,
            skuCode: 'SKU',
            name: 'Item',
          };
        }
        return lineResult;
      });
    }
    if (include?.payment) {
      const payment = [...branchPurchaseOrderPayments.values()].find(
        (p) => p.branchPurchaseOrderId === order.id,
      );
      result.payment = payment ?? null;
    }
    return result;
  };

  const attachVariant = (
    variant: ProductVariantRecord,
    include?: Record<string, unknown>,
  ) => {
    const result: Record<string, unknown> = { ...variant };
    if (include?.product) {
      const product = products.get(variant.productId);
      if (product) {
        if (
          typeof include.product === 'object' &&
          'select' in include.product
        ) {
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

  const attachProduct = (
    product: ProductRecord,
    include?: Record<string, unknown>,
  ) => {
    const result: Record<string, unknown> = { ...product };
    if (include?.category) {
      result.category = product.categoryId
        ? (categories.get(product.categoryId) ?? null)
        : null;
    }
    if (include?.variants) {
      let variants = [...productVariants.values()].filter(
        (v) => v.productId === product.id,
      );
      const variantInclude = include.variants as {
        where?: { isActive?: boolean; masterSkuId?: { not: null } };
        orderBy?: { createdAt: string };
      };
      if (variantInclude.where?.isActive !== undefined) {
        variants = variants.filter(
          (v) => v.isActive === variantInclude.where!.isActive,
        );
      }
      if (variantInclude.where?.masterSkuId?.not === null) {
        variants = variants.filter((v) => v.masterSkuId != null);
      }
      if (variantInclude.orderBy?.createdAt === 'asc') {
        variants = variants.sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
        );
      }
      result.variants = variants;
    }
    return result;
  };

  const matchesProductWhere = (
    product: ProductRecord,
    where: Record<string, unknown>,
  ): boolean => {
    if (where.tenantId && product.tenantId !== where.tenantId) return false;
    if (
      where.isPublished !== undefined &&
      product.isPublished !== where.isPublished
    ) {
      return false;
    }
    if (where.categoryId) {
      const categoryIdFilter = where.categoryId as {
        not?: null;
      };
      if (categoryIdFilter.not === null && product.categoryId == null) {
        return false;
      }
    }
    if (where.category) {
      const categoryFilter = where.category as { slug?: string };
      if (categoryFilter.slug) {
        const cat = product.categoryId
          ? categories.get(product.categoryId)
          : null;
        if (!cat || cat.slug !== categoryFilter.slug) return false;
      }
    }
    if (where.OR && Array.isArray(where.OR)) {
      const orClauses = where.OR as Array<{
        name?: { contains: string; mode?: string };
        description?: { contains: string; mode?: string };
      }>;
      const matchesOr = orClauses.some((clause) => {
        if (clause.name?.contains) {
          return product.name
            .toLowerCase()
            .includes(clause.name.contains.toLowerCase());
        }
        if (clause.description?.contains) {
          return (product.description ?? '')
            .toLowerCase()
            .includes(clause.description.contains.toLowerCase());
        }
        return false;
      });
      if (!matchesOr) return false;
    }
    return true;
  };

  const attachCart = (cart: CartRecord, include?: Record<string, unknown>) => {
    const result: Record<string, unknown> = { ...cart };
    if (include?.items) {
      const itemsInclude = include.items as {
        include?: { variant?: { include?: { product?: boolean } } };
        orderBy?: { createdAt: string };
      };
      let items = [...cartItems.values()].filter((i) => i.cartId === cart.id);
      if (itemsInclude.orderBy?.createdAt === 'asc') {
        items = items.sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
        );
      }
      result.items = items.map((item) => {
        const row: Record<string, unknown> = { ...item };
        if (itemsInclude.include?.variant) {
          const variant = productVariants.get(item.variantId);
          if (variant) {
            if (itemsInclude.include.variant.include?.product) {
              row.variant = {
                ...variant,
                product: products.get(variant.productId),
              };
            } else {
              row.variant = attachVariant(
                variant,
                itemsInclude.include.variant,
              );
            }
          }
        }
        return row;
      });
    }
    if (include?.distributor) {
      result.distributor = cart.distributorId
        ? (distributors.get(cart.distributorId) ?? null)
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
      const entry =
        [...commissionLedgers.values()].find((e) => e.orderId === order.id) ??
        null;
      if (
        entry &&
        typeof include.commissionEntry === 'object' &&
        'include' in include.commissionEntry
      ) {
        const nested = (
          include.commissionEntry as { include?: Record<string, unknown> }
        ).include;
        const enriched: CommissionLedgerRecord & Record<string, unknown> = {
          ...entry,
        };
        if (nested?.distributor) {
          const distributor = distributors.get(entry.distributorId);
          if (
            distributor &&
            typeof nested.distributor === 'object' &&
            'select' in nested.distributor
          ) {
            const select =
              (nested.distributor as { select?: Record<string, boolean> })
                .select ?? {};
            enriched.distributor = Object.fromEntries(
              Object.keys(select)
                .filter((k) => select[k])
                .map((k) => [k, distributor[k as keyof DistributorRecord]]),
            );
          } else {
            enriched.distributor = distributor ?? null;
          }
        }
        result.commissionEntry = enriched;
      } else {
        result.commissionEntry = entry;
      }
    }
    if (include?.distributor && order.distributorId) {
      const distributor = distributors.get(order.distributorId) ?? null;
      if (
        distributor &&
        typeof include.distributor === 'object' &&
        'select' in include.distributor
      ) {
        const select =
          (include.distributor as { select?: Record<string, boolean> })
            .select ?? {};
        result.distributor = Object.fromEntries(
          Object.keys(select)
            .filter((k) => select[k])
            .map((k) => [k, distributor[k as keyof DistributorRecord]]),
        );
      } else {
        result.distributor = distributor;
      }
    }
    if (include?._count) {
      const countInclude = include._count as { select?: { lines?: boolean } };
      if (countInclude.select?.lines) {
        result._count = {
          lines: [...orderLines.values()].filter((l) => l.orderId === order.id)
            .length,
        };
      }
    }
    if (include?.tenant) {
      const tenant = tenants.get(order.tenantId);
      if (typeof include.tenant === 'object' && 'select' in include.tenant) {
        const select = include.tenant.select as Record<string, unknown>;
        const tenantBase = tenant
          ? Object.fromEntries(
              Object.keys(select)
                .filter((k) => k !== 'merchantProfile' && select[k])
                .map((k) => [k, tenant[k as keyof TenantRecord]]),
            )
          : null;
        if (tenant && select.merchantProfile) {
          const profileId = profileByTenant.get(order.tenantId);
          const profile = profileId ? merchantProfiles.get(profileId) : null;
          const mpSelect = (
            select.merchantProfile as { select?: Record<string, boolean> }
          )?.select;
          const merchantProfile =
            profile && mpSelect
              ? Object.fromEntries(
                  Object.keys(mpSelect)
                    .filter((k) => mpSelect[k])
                    .map((k) => [k, profile[k as keyof MerchantProfileRecord]]),
                )
              : profile;
          result.tenant = tenantBase
            ? { ...tenantBase, merchantProfile: merchantProfile ?? null }
            : null;
        } else {
          result.tenant = tenantBase;
        }
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
    const result: CommissionLedgerRecord & Record<string, unknown> = {
      ...entry,
    };
    if (include?.distributor) {
      result.distributor = distributors.get(entry.distributorId);
    }
    if (include?.order && entry.orderId) {
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
        result.order = order ?? null;
      }
    } else if (include?.order) {
      result.order = null;
    }
    if (include?.allocationOrder && entry.allocationOrderId) {
      const allocation = allocationOrders.get(entry.allocationOrderId);
      if (allocation && typeof include.allocationOrder === 'object') {
        if ('include' in include.allocationOrder) {
          const nested = include.allocationOrder.include as Record<
            string,
            unknown
          >;
          result.allocationOrder = {
            ...allocation,
            lines:
              nested.lines && allocation.lines
                ? allocation.lines.map((line) => {
                    const lineSelect = (
                      nested.lines as { select?: Record<string, boolean> }
                    ).select;
                    if (!lineSelect) return line;
                    return Object.fromEntries(
                      Object.keys(lineSelect)
                        .filter((k) => lineSelect[k])
                        .map((k) => [
                          k,
                          line[k as keyof AllocationOrderLineRecord],
                        ]),
                    );
                  })
                : allocation.lines,
          };
        } else {
          result.allocationOrder = allocation;
        }
      } else {
        result.allocationOrder = null;
      }
    }
    if (include?.tenant) {
      const tenant = tenants.get(entry.tenantId);
      if (typeof include.tenant === 'object' && 'select' in include.tenant) {
        const select = include.tenant.select as Record<string, unknown>;
        const tenantBase = tenant
          ? Object.fromEntries(
              Object.keys(select)
                .filter((k) => k !== 'merchantProfile' && select[k])
                .map((k) => [k, tenant[k as keyof TenantRecord]]),
            )
          : null;
        if (tenant && select.merchantProfile) {
          const profileId = profileByTenant.get(entry.tenantId);
          const profile = profileId ? merchantProfiles.get(profileId) : null;
          const mpSelect = (
            select.merchantProfile as { select?: Record<string, boolean> }
          )?.select;
          const merchantProfile =
            profile && mpSelect
              ? Object.fromEntries(
                  Object.keys(mpSelect)
                    .filter((k) => mpSelect[k])
                    .map((k) => [k, profile[k as keyof MerchantProfileRecord]]),
                )
              : profile;
          result.tenant = tenantBase
            ? { ...tenantBase, merchantProfile: merchantProfile ?? null }
            : null;
        } else {
          result.tenant = tenantBase;
        }
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
      const entriesInclude = include.entries as {
        include?: Record<string, unknown>;
      };
      result.entries = [...commissionLedgers.values()]
        .filter((e) => e.settlementBatchId === batch.id)
        .map((e) => attachCommissionEntry(e, entriesInclude.include));
    }
    return result;
  };

  const applyDateRange = (date: Date, range?: { gte?: Date; lte?: Date }) => {
    if (!range) return true;
    if (range.gte && date < range.gte) return false;
    if (range.lte && date > range.lte) return false;
    return true;
  };

  const filterOrders = (where: Record<string, unknown>) => {
    let items = [...orders.values()];
    if (where.tenantId)
      items = items.filter((o) => o.tenantId === where.tenantId);
    if (where.distributorId) {
      items = items.filter((o) => o.distributorId === where.distributorId);
    }
    if (where.status) items = items.filter((o) => o.status === where.status);
    if (where.id) {
      if (
        typeof where.id === 'object' &&
        where.id !== null &&
        'not' in (where.id as { not?: string })
      ) {
        const excluded = (where.id as { not: string }).not;
        items = items.filter((o) => o.id !== excluded);
      } else {
        items = items.filter((o) => o.id === where.id);
      }
    }
    if (where.customerId) {
      if (
        typeof where.customerId === 'object' &&
        where.customerId !== null &&
        'in' in (where.customerId as { in?: string[] })
      ) {
        const ids = (where.customerId as { in: string[] }).in;
        items = items.filter(
          (o) => o.customerId != null && ids.includes(o.customerId),
        );
      } else {
        items = items.filter((o) => o.customerId === where.customerId);
      }
    }
    if (where.fulfillmentType) {
      items = items.filter(
        (o) =>
          (o as OrderRecord & { fulfillmentType?: string }).fulfillmentType ===
          where.fulfillmentType,
      );
    }
    if (where.shippedAt === null) {
      items = items.filter(
        (o) => (o as OrderRecord & { shippedAt?: Date | null }).shippedAt == null,
      );
    }
    if (where.tenant && typeof where.tenant === 'object') {
      const tenantWhere = where.tenant as {
        merchantProfile?: { isFlagship?: boolean };
      };
      if (tenantWhere.merchantProfile?.isFlagship !== undefined) {
        items = items.filter((o) => {
          const profileId = profileByTenant.get(o.tenantId);
          const profile = profileId ? merchantProfiles.get(profileId) : null;
          return profile?.isFlagship === tenantWhere.merchantProfile?.isFlagship;
        });
      }
    }
    if (where.guestEmail) {
      const guestEmail = where.guestEmail as {
        contains?: string;
        mode?: string;
      };
      if (guestEmail.contains) {
        const needle = guestEmail.contains.toLowerCase();
        items = items.filter((o) =>
          o.guestEmail?.toLowerCase().includes(needle),
        );
      }
    }
    if (where.createdAt) {
      items = items.filter((o) =>
        applyDateRange(
          o.createdAt,
          where.createdAt as { gte?: Date; lte?: Date },
        ),
      );
    }
    return items;
  };

  const filterCommissionLedgers = (where: Record<string, unknown>) => {
    let items = [...commissionLedgers.values()];
    if (where.tenantId)
      items = items.filter((e) => e.tenantId === where.tenantId);
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
        applyDateRange(
          e.createdAt,
          where.createdAt as { gte?: Date; lte?: Date },
        ),
      );
    }
    if (where.settlementBatchId === null) {
      items = items.filter((e) => e.settlementBatchId === null);
    }
    if (where.commissionSource) {
      items = items.filter(
        (e) => e.commissionSource === where.commissionSource,
      );
    }
    if (where.allocationOrderId) {
      items = items.filter(
        (e) => e.allocationOrderId === where.allocationOrderId,
      );
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
      if (
        entry &&
        typeof select.commissionEntry === 'object' &&
        'select' in select.commissionEntry
      ) {
        const entrySelect = select.commissionEntry.select as Record<
          string,
          boolean
        >;
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
    if (where.tenantId)
      items = items.filter((sl) => sl.tenantId === where.tenantId);
    if (where.warehouseId)
      items = items.filter((sl) => sl.warehouseId === where.warehouseId);
    if (where.variantId)
      items = items.filter((sl) => sl.variantId === where.variantId);
    return items;
  };

  const attachStockLevel = (
    sl: StockLevelRecord,
    include?: Record<string, unknown>,
  ) => {
    const result: Record<string, unknown> = { ...sl };
    if (include?.warehouse) {
      const warehouse = warehouses.get(sl.warehouseId);
      if (warehouse) {
        result.warehouse = {
          id: warehouse.id,
          name: warehouse.name,
          isDefault: warehouse.isDefault,
        };
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
    if (where.tenantId)
      items = items.filter((a) => a.tenantId === where.tenantId);
    if (where.warehouseId)
      items = items.filter((a) => a.warehouseId === where.warehouseId);
    if (where.variantId)
      items = items.filter((a) => a.variantId === where.variantId);
    if (where.reason) items = items.filter((a) => a.reason === where.reason);
    if (where.createdAt && typeof where.createdAt === 'object') {
      const createdAt = where.createdAt as { gte?: Date; lte?: Date };
      if (createdAt.gte)
        items = items.filter((a) => a.createdAt >= createdAt.gte!);
      if (createdAt.lte)
        items = items.filter((a) => a.createdAt <= createdAt.lte!);
    }
    return items;
  };

  const filterStockTransfers = (where: Record<string, unknown>) => {
    let items = [...stockTransfers.values()];
    if (where.tenantId)
      items = items.filter((t) => t.tenantId === where.tenantId);
    if (where.id) items = items.filter((t) => t.id === where.id);
    if (where.fromWarehouseId) {
      items = items.filter((t) => t.fromWarehouseId === where.fromWarehouseId);
    }
    if (where.toWarehouseId) {
      items = items.filter((t) => t.toWarehouseId === where.toWarehouseId);
    }
    return items;
  };

  const attachStockTransfer = (
    transfer: StockTransferRecord,
    include?: Record<string, unknown>,
  ) => {
    const result: Record<string, unknown> = { ...transfer };
    if (include?.fromWarehouse) {
      const warehouse = warehouses.get(transfer.fromWarehouseId);
      if (warehouse)
        result.fromWarehouse = { id: warehouse.id, name: warehouse.name };
    }
    if (include?.toWarehouse) {
      const warehouse = warehouses.get(transfer.toWarehouseId);
      if (warehouse)
        result.toWarehouse = { id: warehouse.id, name: warehouse.name };
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

  const attachAdjustment = (
    adj: StockAdjustmentRecord,
    include?: Record<string, unknown>,
  ) => {
    const result: Record<string, unknown> = { ...adj };
    if (include?.actor) {
      const actor = users.get(adj.actorId);
      if (actor) result.actor = { id: actor.id, email: actor.email };
    }
    if (include?.warehouse) {
      const warehouse = warehouses.get(adj.warehouseId);
      if (warehouse)
        result.warehouse = { id: warehouse.id, name: warehouse.name };
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
    if (where.tenantId)
      items = items.filter((po) => po.tenantId === where.tenantId);
    if (where.id) items = items.filter((po) => po.id === where.id);
    if (where.status) items = items.filter((po) => po.status === where.status);
    if (where.warehouseId)
      items = items.filter((po) => po.warehouseId === where.warehouseId);
    return items;
  };

  const attachPurchaseOrder = (
    po: PurchaseOrderRecord,
    include?: Record<string, unknown>,
  ) => {
    const result: Record<string, unknown> = { ...po };
    if (include?.warehouse) {
      const warehouse = warehouses.get(po.warehouseId);
      if (warehouse)
        result.warehouse = { id: warehouse.id, name: warehouse.name };
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
                return pol
                  ? { id: pol.id, variantId: pol.variantId }
                  : undefined;
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
      const status = where.onboardingStatus as
        | OnboardingStatus
        | { in?: OnboardingStatus[] };
      if (typeof status === 'string') {
        filtered = filtered.filter((p) => p.onboardingStatus === status);
      } else if (status.in) {
        filtered = filtered.filter((p) =>
          status.in!.includes(p.onboardingStatus),
        );
      }
    }
    if (where.OR && Array.isArray(where.OR)) {
      const orClauses = where.OR as Array<Record<string, unknown>>;
      filtered = filtered.filter((p) =>
        orClauses.some((clause) => {
          for (const [field, cond] of Object.entries(clause)) {
            const c = cond as { contains?: string; mode?: string };
            if (c.contains) {
              const value = String(
                (p as unknown as Record<string, unknown>)[field] ?? '',
              ).toLowerCase();
              if (!value.includes(c.contains.toLowerCase())) return false;
            }
          }
          return true;
        }),
      );
    }
    if (where.isFlagship !== undefined) {
      filtered = filtered.filter((p) => p.isFlagship === where.isFlagship);
    }
    if (where.storePublished !== undefined) {
      filtered = filtered.filter(
        (p) => p.storePublished === where.storePublished,
      );
    }
    return filtered;
  };

  const mock = {
    onModuleInit: jest.fn(),
    onModuleDestroy: jest.fn(),
    $transaction: runTransaction,
    platformUser: {
      findUnique: async ({
        where,
      }: {
        where: { email?: string; id?: string };
      }) => {
        if (where.email) {
          return (
            [...platformUsers.values()].find((u) => u.email === where.email) ??
            null
          );
        }
        if (where.id) {
          return platformUsers.get(where.id) ?? null;
        }
        return null;
      },
      findMany: async ({
        where,
        orderBy,
        select,
      }: {
        where?: { role?: PlatformRole };
        orderBy?: { createdAt?: 'asc' | 'desc' };
        select?: Record<string, boolean>;
      } = {}) => {
        let list = [...platformUsers.values()];
        if (where?.role) {
          list = list.filter((u) => u.role === where.role);
        }
        if (orderBy?.createdAt === 'desc') {
          list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        } else if (orderBy?.createdAt === 'asc') {
          list.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        }
        if (select) {
          return list.map((user) => {
            const row: Record<string, unknown> = {};
            for (const key of Object.keys(select)) {
              if (select[key]) {
                row[key] = user[key as keyof PlatformUserRecord];
              }
            }
            return row;
          });
        }
        return list;
      },
      count: async ({ where }: { where?: { role?: PlatformRole } } = {}) => {
        let list = [...platformUsers.values()];
        if (where?.role) {
          list = list.filter((u) => u.role === where.role);
        }
        return list.length;
      },
      create: async ({
        data,
        select,
      }: {
        data: Omit<PlatformUserRecord, 'id' | 'createdAt' | 'updatedAt'>;
        select?: Record<string, boolean>;
      }) => {
        const existing = [...platformUsers.values()].find(
          (u) => u.email === data.email,
        );
        if (existing) {
          throw new Error('Unique constraint failed on email');
        }
        const record: PlatformUserRecord = {
          id: nextId('pu'),
          createdAt: now(),
          updatedAt: now(),
          ...data,
        };
        platformUsers.set(record.id, record);
        if (select) {
          const row: Record<string, unknown> = {};
          for (const key of Object.keys(select)) {
            if (select[key]) {
              row[key] = record[key as keyof PlatformUserRecord];
            }
          }
          return row;
        }
        return record;
      },
      update: async ({
        where,
        data,
        select,
      }: {
        where: { id: string };
        data: Partial<PlatformUserRecord>;
        select?: Record<string, boolean>;
      }) => {
        const existing = platformUsers.get(where.id);
        if (!existing) throw new Error('PlatformUser not found');
        const updated = { ...existing, ...data, updatedAt: now() };
        platformUsers.set(existing.id, updated);
        if (select) {
          const row: Record<string, unknown> = {};
          for (const key of Object.keys(select)) {
            if (select[key]) {
              row[key] = updated[key as keyof PlatformUserRecord];
            }
          }
          return row;
        }
        return updated;
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
        const existing = [...platformUsers.values()].find(
          (u) => u.email === where.email,
        );
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
      delete: async ({ where }: { where: { id: string } }) => {
        const existing = platformUsers.get(where.id);
        if (!existing) throw new Error('PlatformUser not found');
        platformUsers.delete(where.id);
        return existing;
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
              .filter((c) => c.accountId === account.id)
              .map((c) => ({
                ...c,
                tenant: {
                  ...tenants.get(c.tenantId),
                  merchantProfile: (() => {
                    const pid = profileByTenant.get(c.tenantId);
                    return pid ? merchantProfiles.get(pid) : null;
                  })(),
                },
                orders: [...orders.values()].filter(
                  (o) => o.customerId === c.id,
                ),
              })),
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
              (u) =>
                u.accountId === a.id &&
                u.role === where.merchantUsers!.some.role,
            ),
          );
        }
        if (orderBy?.createdAt === 'desc') {
          rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }
        const slice = rows.slice(
          skip,
          take === undefined ? undefined : skip + take,
        );
        if (include) {
          return slice.map((account) => ({
            ...account,
            customers: [...customers.values()].filter(
              (c) => c.accountId === account.id,
            ),
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
        const rows = await mock.platformAccount.findMany({
          where: where,
        });
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
      findUnique: async ({
        where,
      }: {
        where: { id?: string; slug?: string };
      }) => {
        if (where.id) return tenants.get(where.id) ?? null;
        if (where.slug) {
          return (
            [...tenants.values()].find((t) => t.slug === where.slug) ?? null
          );
        }
        return null;
      },
      findUniqueOrThrow: async ({
        where,
      }: {
        where: { id?: string; slug?: string };
      }) => {
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
          operationalFrozen: data.operationalFrozen ?? false,
          isFlagship: data.isFlagship ?? false,
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
              users: [...users.values()].filter(
                (u) => u.tenantId === profile.tenantId,
              ),
            };
          }
          return { ...profile, tenant: tenantData };
        }
        return profile;
      },
      findFirst: async ({
        where,
        include,
      }: {
        where?: Record<string, unknown>;
        include?: { tenant?: boolean };
      } = {}) => {
        const items = filterMerchantProfiles(
          [...merchantProfiles.values()],
          where,
        );
        const profile = items[0];
        if (!profile) return null;
        if (include?.tenant) {
          const tenant = tenants.get(profile.tenantId);
          return { ...profile, tenant };
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
        let items = filterMerchantProfiles(
          [...merchantProfiles.values()],
          where,
        );
        if (orderBy?.createdAt === 'desc') {
          items = items.sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
          );
        } else if (orderBy?.createdAt === 'asc') {
          items = items.sort(
            (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
          );
        }
        items = items.slice(skip, skip + take);
        if (select) {
          return items.map((p) => {
            const row: Record<string, unknown> = {};
            if (select.id) row.id = p.id;
            if (select.businessName) row.businessName = p.businessName;
            if (select.contactEmail) row.contactEmail = p.contactEmail;
            if (select.onboardingStatus)
              row.onboardingStatus = p.onboardingStatus;
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
        return filterMerchantProfiles([...merchantProfiles.values()], where)
          .length;
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
      updateMany: async ({
        where,
        data,
      }: {
        where: {
          isFlagship?: boolean;
          id?: { not?: string };
        };
        data: Partial<MerchantProfileRecord>;
      }) => {
        let count = 0;
        for (const [id, profile] of merchantProfiles.entries()) {
          if (
            where.isFlagship !== undefined &&
            profile.isFlagship !== where.isFlagship
          ) {
            continue;
          }
          if (where.id?.not && id === where.id.not) continue;
          merchantProfiles.set(id, { ...profile, ...data, updatedAt: now() });
          count += 1;
        }
        return { count };
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
        const user =
          [...users.values()].find((u) => {
            if (where.email && u.email !== where.email) return false;
            if (where.id && u.id !== where.id) return false;
            if (where.tenantId && u.tenantId !== where.tenantId) return false;
            if (where.accountId && u.accountId !== where.accountId)
              return false;
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
              merchantProfile: profileId
                ? merchantProfiles.get(profileId)
                : null,
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
      findUnique: async ({
        where,
        include,
      }: {
        where: { id: string };
        include?: {
          account?: boolean | { select?: { firstName?: boolean; lastName?: boolean } };
        };
      }) => {
        const user = users.get(where.id) ?? null;
        if (!user) return null;
        let result: Record<string, unknown> = { ...user };
        if (include?.account) {
          const account = platformAccounts.get(user.accountId) ?? null;
          if (
            account &&
            typeof include.account === 'object' &&
            include.account.select
          ) {
            const picked: Record<string, unknown> = {};
            if (include.account.select.firstName) picked.firstName = account.firstName;
            if (include.account.select.lastName) picked.lastName = account.lastName;
            result = { ...result, account: picked };
          } else {
            result = { ...result, account };
          }
        }
        return result as UserRecord & {
          account?: PlatformAccountRecord | { firstName: string | null; lastName: string | null } | null;
        };
      },
      findMany: async ({
        where,
        orderBy,
        select,
      }: {
        where?: { tenantId?: string };
        orderBy?: { createdAt?: 'asc' | 'desc' };
        select?: {
          id?: boolean;
          email?: boolean;
          role?: boolean;
          createdAt?: boolean;
        };
      }) => {
        let items = [...users.values()];
        if (where?.tenantId)
          items = items.filter((u) => u.tenantId === where.tenantId);
        if (orderBy?.createdAt === 'asc') {
          items = items.sort(
            (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
          );
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
        select?: {
          id?: boolean;
          email?: boolean;
          role?: boolean;
          createdAt?: boolean;
        };
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
        select?: {
          id?: boolean;
          email?: boolean;
          role?: boolean;
          createdAt?: boolean;
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
        select?: {
          id?: boolean;
          email?: boolean;
          role?: boolean;
          createdAt?: boolean;
        };
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
        [...companies.values()].filter((c) => c.tenantId === where.tenantId)
          .length,
      findFirst: async ({
        where,
      }: {
        where: { id: string; tenantId: string };
      }) =>
        [...companies.values()].find(
          (c) => c.id === where.id && c.tenantId === where.tenantId,
        ) ?? null,
      create: async ({
        data,
      }: {
        data: MockCreateInput<
          CrmCompanyRecord,
          'id' | 'createdAt' | 'updatedAt',
          'website'
        >;
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
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<CrmCompanyRecord>;
      }) => {
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
        [...contacts.values()].filter((c) => c.tenantId === where.tenantId)
          .length,
      findFirst: async ({
        where,
      }: {
        where: { id: string; tenantId: string };
      }) =>
        [...contacts.values()].find(
          (c) => c.id === where.id && c.tenantId === where.tenantId,
        ) ?? null,
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
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<CrmContactRecord>;
      }) => {
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
      findFirst: async ({
        where,
      }: {
        where: { id: string; tenantId: string };
      }) =>
        [...leads.values()].find(
          (l) => l.id === where.id && l.tenantId === where.tenantId,
        ) ?? null,
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
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<CrmLeadRecord>;
      }) => {
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
      findFirst: async ({
        where,
      }: {
        where: { id: string; tenantId: string };
      }) =>
        [...activities.values()].find(
          (a) => a.id === where.id && a.tenantId === where.tenantId,
        ) ?? null,
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
    distributor: (() => {
      const attachDistributorIncludes = (
        distributor: DistributorRecord,
        include?: {
          _count?: { select: { recruitedMerchants?: boolean } };
          account?: { select: { id?: boolean; email?: boolean } };
        },
      ) => {
        let row: Record<string, unknown> = { ...distributor };
        if (include?._count?.select?.recruitedMerchants) {
          const recruitedMerchantCount = [...merchantProfiles.values()].filter(
            (m) => m.recruitedByDistributorId === distributor.id,
          ).length;
          row = {
            ...row,
            _count: { recruitedMerchants: recruitedMerchantCount },
          };
        }
        if (include?.account) {
          const account = distributor.accountId
            ? (platformAccounts.get(distributor.accountId) ?? null)
            : null;
          if (account) {
            row = {
              ...row,
              account: {
                ...(include.account.select?.id === false
                  ? {}
                  : { id: account.id }),
                ...(include.account.select?.email === false
                  ? {}
                  : { email: account.email }),
              },
            };
          } else {
            row = { ...row, account: null };
          }
        }
        return row;
      };

      return {
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
          if (where?.tenantId !== undefined) {
            items = items.filter((d) => d.tenantId === where.tenantId);
          }
          if (where?.OR) {
            const orClauses = where.OR as Array<Record<string, unknown>>;
            items = items.filter((d) =>
              orClauses.some((clause) => {
                if (clause.email && d.email === clause.email) return true;
                const accountClause = clause.account as
                  | { email?: string }
                  | undefined;
                if (accountClause?.email && d.accountId) {
                  const account = platformAccounts.get(d.accountId);
                  return account?.email === accountClause.email;
                }
                return false;
              }),
            );
          }
          if (where?.email) {
            items = items.filter((d) => d.email === where.email);
          }
          if (where?.portalEnabled !== undefined) {
            items = items.filter(
              (d) => d.portalEnabled === where.portalEnabled,
            );
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
          if (include?.account) {
            return items.map((d) => ({
              ...d,
              account: d.accountId
                ? (platformAccounts.get(d.accountId) ?? null)
                : null,
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
            tenantId?: string | null;
            email?: string | { equals: string; mode?: string };
            isActive?: boolean;
            portalEnabled?: boolean;
            tenant?: { slug?: string };
            account?: { email?: string };
          };
          include?: {
            tenant?: boolean;
            qrCodes?: { take?: number };
            account?: { select?: { password?: boolean } };
          };
        }) => {
          let items = [...distributors.values()];
          if (where.id) items = items.filter((d) => d.id === where.id);
          if (where.tenantId !== undefined) {
            items = items.filter((d) => d.tenantId === where.tenantId);
          }
          if (where.account?.email) {
            items = items.filter((d) => {
              if (!d.accountId) return false;
              const account = platformAccounts.get(d.accountId);
              return account?.email === where.account!.email;
            });
          }
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
            items = items.filter(
              (d) => d.portalEnabled === where.portalEnabled,
            );
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
              tenant: distributor.tenantId
                ? (tenants.get(distributor.tenantId) ?? null)
                : null,
            };
          }
          if (include?.account) {
            const account = distributor.accountId
              ? (platformAccounts.get(distributor.accountId) ?? null)
              : null;
            const select = include.account.select;
            if (select?.password && account) {
              return {
                ...distributor,
                account: { password: account.password },
              };
            }
            return { ...distributor, account };
          }
          return distributor;
        },
        create: async ({
          data,
          include,
        }: {
          data: MockCreateInput<
            DistributorRecord,
            | 'id'
            | 'createdAt'
            | 'updatedAt'
            | 'isActive'
            | 'passwordHash'
            | 'portalEnabled'
            | 'lastLoginAt',
            | 'tenantId'
            | 'email'
            | 'phone'
            | 'isActive'
            | 'passwordHash'
            | 'portalEnabled'
            | 'lastLoginAt'
          >;
          include?: {
            _count?: { select: { recruitedMerchants?: boolean } };
            account?: { select: { id?: boolean; email?: boolean } };
          };
        }) => {
          const record: DistributorRecord = {
            ...data,
            id: nextId('dist'),
            tenantId: data.tenantId ?? null,
            accountId: data.accountId ?? null,
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
          return attachDistributorIncludes(record, include);
        },
        update: async ({
          where,
          data,
          include,
        }: {
          where: { id: string };
          data: Partial<DistributorRecord>;
          include?: {
            _count?: { select: { recruitedMerchants?: boolean } };
            account?: { select: { id?: boolean; email?: boolean } };
          };
        }) => {
          const existing = distributors.get(where.id);
          if (!existing) throw new Error('Not found');
          const updated = { ...existing, ...data, updatedAt: now() };
          distributors.set(where.id, updated);
          return attachDistributorIncludes(updated, include);
        },
        delete: async ({ where }: { where: { id: string } }) => {
          const existing = distributors.get(where.id);
          distributors.delete(where.id);
          return existing;
        },
        findUnique: async ({
          where,
        }: {
          where: { id?: string; accountId?: string };
        }) => {
          if (where.id) return distributors.get(where.id) ?? null;
          if (where.accountId) {
            return (
              [...distributors.values()].find(
                (d) => d.accountId === where.accountId,
              ) ?? null
            );
          }
          return null;
        },
      };
    })(),
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
        const rows = [...qrCodes.values()].filter((qr) => {
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
          qrCodes.set(id, {
            ...qr,
            ...data,
            revokedAt: data.revokedAt ?? nowDate,
          });
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
            if (where.accountId && c.accountId !== where.accountId)
              return false;
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
        data: Partial<
          Omit<CustomerRecord, 'id' | 'createdAt' | 'updatedAt'>
        > & {
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
      findMany: async ({
        where,
        select,
      }: {
        where?: { accountId?: string };
        select?: { id?: boolean; tenantId?: boolean };
      }) => {
        let items = [...customers.values()];
        if (where?.accountId) {
          items = items.filter((c) => c.accountId === where.accountId);
        }
        if (select) {
          return items.map((c) => {
            const row: Record<string, unknown> = {};
            if (select.id) row.id = c.id;
            if (select.tenantId) row.tenantId = c.tenantId;
            return row;
          });
        }
        return items;
      },
      count: async ({ where }: { where?: { accountId?: string } }) => {
        let rows = [...customers.values()];
        if (where?.accountId) {
          rows = rows.filter((c) => c.accountId === where.accountId);
        }
        return rows.length;
      },
      findMany: async ({
        where,
        include,
        orderBy,
      }: {
        where?: {
          tenantId?: string;
          orders?: { some?: { status?: string } };
        };
        include?: {
          orders?: {
            where?: { status?: string };
            select?: { total?: boolean; createdAt?: boolean };
            orderBy?: { createdAt: 'desc' | 'asc' };
          };
        };
        orderBy?: { updatedAt?: 'desc' | 'asc' };
      }) => {
        let rows = [...customers.values()];
        if (where?.tenantId) {
          rows = rows.filter((c) => c.tenantId === where.tenantId);
        }
        if (where?.orders?.some?.status) {
          const status = where.orders.some.status;
          rows = rows.filter((c) =>
            [...orders.values()].some(
              (o) =>
                o.customerId === c.id &&
                o.tenantId === c.tenantId &&
                o.status === status,
            ),
          );
        }
        if (orderBy?.updatedAt === 'desc') {
          rows = rows.sort(
            (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
          );
        } else if (orderBy?.updatedAt === 'asc') {
          rows = rows.sort(
            (a, b) => a.updatedAt.getTime() - b.updatedAt.getTime(),
          );
        }
        return rows.map((customer) => {
          if (!include?.orders) return customer;
          let customerOrders = [...orders.values()].filter(
            (o) => o.customerId === customer.id && o.tenantId === customer.tenantId,
          );
          if (include.orders.where?.status) {
            customerOrders = customerOrders.filter(
              (o) => o.status === include.orders!.where!.status,
            );
          }
          if (include.orders.orderBy?.createdAt === 'desc') {
            customerOrders = customerOrders.sort(
              (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
            );
          } else if (include.orders.orderBy?.createdAt === 'asc') {
            customerOrders = customerOrders.sort(
              (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
            );
          }
          const select = include.orders.select;
          const mappedOrders = customerOrders.map((o) => {
            if (!select) return o;
            const picked: Record<string, unknown> = {};
            if (select.total) picked.total = o.total;
            if (select.createdAt) picked.createdAt = o.createdAt;
            return picked;
          });
          return { ...customer, orders: mappedOrders };
        });
      },
      updateMany: async ({
        where,
        data,
      }: {
        where?: { accountId?: string };
        data: Partial<Pick<CustomerRecord, 'firstName' | 'lastName'>>;
      }) => {
        let count = 0;
        for (const [id, row] of customers.entries()) {
          if (where?.accountId && row.accountId !== where.accountId) continue;
          customers.set(id, { ...row, ...data, updatedAt: now() });
          count++;
        }
        return { count };
      },
    },
    category: {
      findMany: async ({ where }: { where: { tenantId: string } }) =>
        [...categories.values()].filter((c) => c.tenantId === where.tenantId),
      findFirst: async ({
        where,
      }: {
        where: {
          id?: string;
          tenantId?: string;
          slug?: string;
          NOT?: { id: string };
        };
      }) => {
        let items = [...categories.values()];
        if (where.id) items = items.filter((c) => c.id === where.id);
        if (where.tenantId)
          items = items.filter((c) => c.tenantId === where.tenantId);
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
            (data.parent?.disconnect
              ? null
              : (data.parentId ?? existing.parentId)),
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
        select,
      }: {
        where: Record<string, unknown>;
        include?: Record<string, unknown>;
        select?: Record<string, unknown>;
        orderBy?: { createdAt: 'desc' | 'asc' };
      }) => {
        let items = [...products.values()].filter((p) =>
          matchesProductWhere(p, where),
        );
        if (orderBy?.createdAt === 'desc') {
          items = items.sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
          );
        }
        if (select) {
          return items.map((p) => {
            const row: Record<string, unknown> = {};
            if (select.category) {
              row.category = p.categoryId
                ? categories.get(p.categoryId) ?? null
                : null;
            }
            return row;
          });
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
        include?: {
          category?: boolean | { select: Record<string, boolean> };
          variants?: {
            where?: { isActive?: boolean };
            orderBy?: { createdAt: string };
          };
        };
      }) => {
        let items = [...products.values()];
        if (where.id) items = items.filter((p) => p.id === where.id);
        if (where.tenantId)
          items = items.filter((p) => p.tenantId === where.tenantId);
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
          variants?: {
            create: Array<
              Omit<
                ProductVariantRecord,
                'id' | 'productId' | 'createdAt' | 'updatedAt'
              >
            >;
          };
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
              masterSkuId: v.masterSkuId ?? null,
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
        data: Partial<ProductRecord> & {
          category?: { connect?: { id: string }; disconnect?: boolean };
        };
        include?: {
          category?: boolean;
          variants?: { orderBy?: { createdAt: string } };
        };
      }) => {
        const existing = products.get(where.id);
        if (!existing) throw new Error('Product not found');
        const updated: ProductRecord = {
          ...existing,
          ...data,
          categoryId:
            data.category?.connect?.id ??
            (data.category?.disconnect
              ? null
              : (data.categoryId ?? existing.categoryId)),
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
            product: product ? { tenantId: product.tenantId } : null,
          };
        }
        return variant;
      },
      findFirst: async ({
        where,
        include,
      }: {
        where?: {
          id?: string;
          masterSkuId?: string;
          isActive?: boolean;
          product?: { tenantId?: string; isPublished?: boolean };
        };
        include?: { product?: boolean };
      } = {}) => {
        let items = [...productVariants.values()];
        if (where?.id) items = items.filter((v) => v.id === where.id);
        if (where?.masterSkuId) {
          items = items.filter((v) => v.masterSkuId === where.masterSkuId);
        }
        if (where?.isActive !== undefined) {
          items = items.filter((v) => v.isActive === where.isActive);
        }
        if (where?.product) {
          items = items.filter((v) => {
            const product = products.get(v.productId);
            if (!product) return false;
            if (
              where.product?.tenantId &&
              product.tenantId !== where.product.tenantId
            ) {
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
        if (include?.product) {
          const product = products.get(variant.productId);
          return { ...variant, product };
        }
        return attachVariant(variant, {
          product: {
            select: { id: true, name: true, slug: true, isPublished: true },
          },
        });
      },
      findMany: async ({
        where,
        select,
        include,
        orderBy,
      }: {
        where?: {
          product?: { tenantId?: string };
          id?: { in: string[] };
          masterSkuId?: { in: string[] } | string;
          isActive?: boolean;
        };
        select?: {
          id?: boolean;
          inventory?: boolean;
          reorderThreshold?: boolean;
        };
        include?: { product?: { select?: Record<string, boolean> } };
        orderBy?: { createdAt?: 'asc' | 'desc' };
      } = {}) => {
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
        if (where?.masterSkuId) {
          if (typeof where.masterSkuId === 'string') {
            items = items.filter((v) => v.masterSkuId === where.masterSkuId);
          } else if (where.masterSkuId.in) {
            items = items.filter(
              (v) =>
                v.masterSkuId && where.masterSkuId!.in.includes(v.masterSkuId),
            );
          }
        }
        if (where?.isActive !== undefined) {
          items = items.filter((v) => v.isActive === where.isActive);
        }
        if (orderBy?.createdAt) {
          items.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        }
        if (include?.product) {
          return items.map((v) => ({
            ...v,
            product: products.get(v.productId) ?? null,
          }));
        }
        if (select) {
          return items.map((v) => {
            const row: Record<string, unknown> = {};
            if (select.id) row.id = v.id;
            if (select.inventory) row.inventory = v.inventory;
            if (select.reorderThreshold)
              row.reorderThreshold = v.reorderThreshold;
            return row;
          });
        }
        return items;
      },
      create: async ({
        data,
        include,
      }: {
        data: Omit<ProductVariantRecord, 'id' | 'createdAt' | 'updatedAt'> & {
          masterSkuId?: string | null;
        };
        include?: { product?: boolean };
      }) => {
        const record: ProductVariantRecord = {
          ...data,
          masterSkuId: data.masterSkuId ?? null,
          id: nextId('var'),
          createdAt: now(),
          updatedAt: now(),
          reorderThreshold: data.reorderThreshold ?? null,
        };
        productVariants.set(record.id, record);
        if (include?.product) {
          return { ...record, product: products.get(record.productId) ?? null };
        }
        return record;
      },
      createMany: async ({
        data,
      }: {
        data: Array<
          Omit<ProductVariantRecord, 'id' | 'createdAt' | 'updatedAt'>
        >;
      }) => {
        for (const item of data) {
          const record: ProductVariantRecord = {
            ...item,
            masterSkuId: item.masterSkuId ?? null,
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
        data: Partial<ProductVariantRecord> & {
          inventory?: { decrement: number } | number;
        };
      }) => {
        const existing = productVariants.get(where.id);
        if (!existing) throw new Error('Variant not found');
        let inventory = existing.inventory;
        if (typeof data.inventory === 'number') {
          inventory = data.inventory;
        } else if (
          data.inventory &&
          typeof data.inventory === 'object' &&
          'decrement' in data.inventory
        ) {
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
          deliveryFlatFee: data.deliveryFlatFee ?? new Prisma.Decimal(0),
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
          deliveryFlatFee: create.deliveryFlatFee ?? new Prisma.Decimal(0),
        };
        tenantSettings.set(record.tenantId, record);
        return record;
      },
    },
    platformSettings: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        platformSettings.get(where.id) ?? null,
      findFirst: async () => {
        const first = [...platformSettings.values()][0];
        if (first) return first;
        return {
          id: 'default',
          platformName: 'MeridianERP',
          supportEmail: null,
          distributorPortalEnabled: true,
          emailQueueEnabled: true,
          maxRetailPriceDeviationPercent: 10,
          updatedAt: now(),
        };
      },
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
          maxRetailPriceDeviationPercent:
            create.maxRetailPriceDeviationPercent ?? 10,
          updatedAt: now(),
        };
        platformSettings.set(record.id, record);
        return record;
      },
    },
    pluginDefinition: {
      findUnique: async ({
        where,
      }: {
        where: { code?: string; id?: string };
      }) => {
        if (where.code) {
          return (
            [...pluginDefinitions.values()].find((p) => p.code === where.code) ??
            null
          );
        }
        if (where.id) {
          return pluginDefinitions.get(where.id) ?? null;
        }
        return null;
      },
      findMany: async ({
        where,
        orderBy,
      }: {
        where?: {
          status?: { not?: string };
          isDefaultOnSignup?: boolean;
        };
        orderBy?: { sortOrder?: 'asc' | 'desc' };
      } = {}) => {
        let items = [...pluginDefinitions.values()];
        if (where?.status?.not) {
          items = items.filter((p) => p.status !== where.status!.not);
        }
        if (where?.isDefaultOnSignup != null) {
          items = items.filter(
            (p) => p.isDefaultOnSignup === where.isDefaultOnSignup,
          );
        }
        if (orderBy?.sortOrder === 'asc') {
          items = items.sort((a, b) => a.sortOrder - b.sortOrder);
        }
        return items;
      },
      upsert: async ({
        where,
        create,
        update,
      }: {
        where: { code: string };
        create: Omit<PluginDefinitionRecord, 'id' | 'createdAt' | 'updatedAt'>;
        update: Partial<PluginDefinitionRecord>;
      }) => {
        const existing = [...pluginDefinitions.values()].find(
          (p) => p.code === where.code,
        );
        if (existing) {
          const updated: PluginDefinitionRecord = {
            ...existing,
            ...update,
            updatedAt: now(),
          };
          pluginDefinitions.set(existing.id, updated);
          return updated;
        }
        const record: PluginDefinitionRecord = {
          id: nextId('plugin'),
          code: create.code,
          category: create.category,
          icon: create.icon,
          sortOrder: create.sortOrder ?? 0,
          nameKey: create.nameKey,
          descriptionKey: create.descriptionKey,
          navRoutes: create.navRoutes ?? null,
          status: create.status ?? 'ACTIVE',
          isDefaultOnSignup: create.isDefaultOnSignup ?? false,
          createdAt: now(),
          updatedAt: now(),
        };
        pluginDefinitions.set(record.id, record);
        return record;
      },
    },
    tenantPlugin: {
      findUnique: async ({
        where,
        include,
      }: {
        where: { tenantId_pluginId?: { tenantId: string; pluginId: string } };
        include?: { plugin?: boolean };
      }) => {
        if (!where.tenantId_pluginId) return null;
        const { tenantId, pluginId } = where.tenantId_pluginId;
        const record = [...tenantPlugins.values()].find(
          (row) => row.tenantId === tenantId && row.pluginId === pluginId,
        );
        if (!record) return null;
        if (include?.plugin) {
          return {
            ...record,
            plugin: pluginDefinitions.get(record.pluginId) ?? null,
          };
        }
        return record;
      },
      findMany: async ({
        where,
        include,
        orderBy,
      }: {
        where?: {
          tenantId?: string;
          status?: 'INSTALLED' | 'UNINSTALLED';
        };
        include?: { plugin?: boolean };
        orderBy?: { plugin?: { sortOrder?: 'asc' | 'desc' } };
      } = {}) => {
        let items = [...tenantPlugins.values()];
        if (where?.tenantId) {
          items = items.filter((row) => row.tenantId === where.tenantId);
        }
        if (where?.status) {
          items = items.filter((row) => row.status === where.status);
        }
        if (orderBy?.plugin?.sortOrder === 'asc') {
          items = items.sort((a, b) => {
            const pa = pluginDefinitions.get(a.pluginId);
            const pb = pluginDefinitions.get(b.pluginId);
            return (pa?.sortOrder ?? 0) - (pb?.sortOrder ?? 0);
          });
        }
        if (include?.plugin) {
          return items.map((row) => ({
            ...row,
            plugin: pluginDefinitions.get(row.pluginId) ?? null,
          }));
        }
        return items;
      },
      upsert: async ({
        where,
        create,
        update,
      }: {
        where: { tenantId_pluginId: { tenantId: string; pluginId: string } };
        create: Omit<TenantPluginRecord, 'id' | 'createdAt' | 'updatedAt'>;
        update: Partial<TenantPluginRecord>;
      }) => {
        const { tenantId, pluginId } = where.tenantId_pluginId;
        const existing = [...tenantPlugins.values()].find(
          (row) => row.tenantId === tenantId && row.pluginId === pluginId,
        );
        if (existing) {
          const updated: TenantPluginRecord = {
            ...existing,
            ...update,
            updatedAt: now(),
          };
          tenantPlugins.set(existing.id, updated);
          return updated;
        }
        const record: TenantPluginRecord = {
          id: nextId('tenant_plugin'),
          tenantId: create.tenantId,
          pluginId: create.pluginId,
          status: create.status ?? 'INSTALLED',
          installedAt: create.installedAt ?? now(),
          uninstalledAt: create.uninstalledAt ?? null,
          installedByUserId: create.installedByUserId ?? null,
          createdAt: now(),
          updatedAt: now(),
        };
        tenantPlugins.set(record.id, record);
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
        if (where.tenantId)
          items = items.filter((w) => w.tenantId === where.tenantId);
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
              .map((sl) => ({
                quantityOnHand: sl.quantityOnHand,
                variantId: sl.variantId,
              }));
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
        if (where.tenantId)
          items = items.filter((w) => w.tenantId === where.tenantId);
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
          if (where.isDefault !== undefined && w.isDefault !== where.isDefault)
            continue;
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
          items = items.sort(
            (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
          );
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
        where: {
          warehouseId_variantId: { warehouseId: string; variantId: string };
        };
      }) => {
        const { warehouseId, variantId } = where.warehouseId_variantId;
        return (
          [...stockLevels.values()].find(
            (sl) =>
              sl.warehouseId === warehouseId && sl.variantId === variantId,
          ) ?? null
        );
      },
      upsert: async ({
        where,
        create,
        update,
      }: {
        where: {
          warehouseId_variantId: { warehouseId: string; variantId: string };
        };
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
          items = items.sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
          );
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
          items = items.sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
          );
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
          lines?: {
            create: Array<Omit<StockTransferLineRecord, 'id' | 'transferId'>>;
          };
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
          items = items.sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
          );
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
          lines?: {
            create: Array<
              Omit<
                PurchaseOrderLineRecord,
                | 'id'
                | 'purchaseOrderId'
                | 'createdAt'
                | 'updatedAt'
                | 'quantityReceived'
              >
            >;
          };
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
          items = items.filter(
            (l) => l.purchaseOrderId === where.purchaseOrderId,
          );
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
        data: Array<
          Omit<
            PurchaseOrderLineRecord,
            'id' | 'createdAt' | 'updatedAt' | 'quantityReceived'
          >
        >;
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
          lines?: {
            create: Array<{
              purchaseOrderLineId: string;
              quantityReceived: number;
            }>;
          };
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
        if (where.tenantId)
          items = items.filter((c) => c.tenantId === where.tenantId);
        if (where.customerId !== undefined) {
          items = items.filter((c) => c.customerId === where.customerId);
        }
        if (where.sessionId)
          items = items.filter((c) => c.sessionId === where.sessionId);
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
        if (where.cartId)
          items = items.filter((i) => i.cartId === where.cartId);
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
          items = items.sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
          );
        }
        if (orderBy?.createdAt === 'asc') {
          items = items.sort(
            (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
          );
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
      findUniqueOrThrow: async ({
        where,
        include,
      }: {
        where: { id?: string; stripePaymentIntentId?: string };
        include?: Record<string, unknown>;
      }) => {
        const order = await mock.order.findUnique({ where, include });
        if (!order) throw new Error('Order not found');
        return order;
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
    orderLine: {
      aggregate: async ({
        where,
        _sum,
      }: {
        where?: {
          variantId?: string;
          order?: { status?: OrderStatus };
        };
        _sum?: { quantity?: boolean };
      }) => {
        let lines = [...orderLines.values()];
        if (where?.variantId) {
          lines = lines.filter((l) => l.variantId === where.variantId);
        }
        if (where?.order?.status) {
          lines = lines.filter((l) => {
            const order = orders.get(l.orderId);
            return order?.status === where.order?.status;
          });
        }
        const quantity = lines.reduce((sum, l) => sum + l.quantity, 0);
        return {
          _sum: _sum?.quantity ? { quantity } : undefined,
        };
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
          items = items.sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
          );
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
          orderId: data.orderId ?? null,
          allocationOrderId: data.allocationOrderId ?? null,
          customerId: data.customerId ?? null,
          customerOrderSequence: data.customerOrderSequence ?? null,
          merchantAllocationSequence: data.merchantAllocationSequence ?? null,
          commissionSource: data.commissionSource ?? null,
          settlementBatchId: null,
          settledAt: null,
          status: data.status ?? LedgerStatus.ACCRUED,
          createdAt: data.createdAt ?? now(),
          updatedAt: data.updatedAt ?? now(),
        };
        commissionLedgers.set(record.id, record);
        return record;
      },
      findUnique: async ({
        where,
      }: {
        where: { id?: string; orderId?: string };
      }) => {
        if (where.id) {
          return commissionLedgers.get(where.id) ?? null;
        }
        if (where.orderId) {
          return (
            [...commissionLedgers.values()].find(
              (e) => e.orderId === where.orderId,
            ) ?? null
          );
        }
        return null;
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<CommissionLedgerRecord>;
      }) => {
        const existing = commissionLedgers.get(where.id);
        if (!existing) throw new Error('CommissionLedger not found');
        const updated = { ...existing, ...data, updatedAt: now() };
        commissionLedgers.set(where.id, updated);
        return updated;
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
            commissionLedgers.set(id, {
              ...existing,
              ...data,
              updatedAt: now(),
            });
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
          items = items.sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
          );
        }
        return items.map((b) => attachSettlementBatch(b, include));
      },
      create: async ({
        data,
      }: {
        data: Omit<
          SettlementBatchRecord,
          'id' | 'createdAt' | 'updatedAt' | 'exportedAt'
        > & {
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
      findUnique: async () => null,
      findMany: async () => [],
      count: async () => 0,
      groupBy: async () => [],
      create: async () => {
        throw new Error('Bindings removed');
      },
    },
    masterSku: {
      findMany: async ({
        where,
        orderBy,
        skip,
        take,
      }: {
        where?: { id?: { in: string[] }; isActive?: boolean };
        orderBy?: { skuCode?: 'asc' | 'desc' };
        skip?: number;
        take?: number;
      } = {}) => {
        let items = [...masterSkus.values()];
        if (where?.id?.in) {
          items = items.filter((s) => where.id!.in.includes(s.id));
        }
        if (where?.isActive !== undefined) {
          items = items.filter((s) => s.isActive === where.isActive);
        }
        if (orderBy?.skuCode) {
          items.sort((a, b) => a.skuCode.localeCompare(b.skuCode));
        }
        if (skip) items = items.slice(skip);
        if (take) items = items.slice(0, take);
        return items;
      },
      findUnique: async ({ where }: { where: { id: string } }) =>
        masterSkus.get(where.id) ?? null,
      findFirst: async ({
        where,
      }: {
        where?: { id?: string };
      } = {}) => {
        if (where?.id) return masterSkus.get(where.id) ?? null;
        return [...masterSkus.values()][0] ?? null;
      },
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const record: MasterSkuRecord = {
          id: nextId('msku'),
          skuCode: data.skuCode as string,
          name: data.name as string,
          quantityOnHand: (data.quantityOnHand as number) ?? 0,
          cumulativeShippedQty: 0,
          unitCost: data.unitCost as Prisma.Decimal,
          wholesalePrice: data.wholesalePrice as Prisma.Decimal,
          retailPrice: data.retailPrice as Prisma.Decimal,
          flagshipPrice:
            (data.flagshipPrice as Prisma.Decimal) ??
            (data.retailPrice as Prisma.Decimal),
          isActive: (data.isActive as boolean) ?? true,
          createdAt: now(),
          updatedAt: now(),
        };
        masterSkus.set(record.id, record);
        return record;
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Record<string, unknown>;
      }) => {
        const existing = masterSkus.get(where.id);
        if (!existing) return null;
        const updated = {
          ...existing,
          ...data,
          updatedAt: now(),
        };
        masterSkus.set(where.id, updated);
        return updated;
      },
      count: async () => masterSkus.size,
    },
    allocationOrder: {
      findMany: async ({
        where,
        include,
        orderBy,
      }: {
        where?: {
          tenantId?: string;
          status?: { in?: string[] };
        };
        include?: { lines?: boolean };
        orderBy?: { createdAt: 'asc' | 'desc' };
      } = {}) => {
        let items = [...allocationOrders.values()];
        if (where?.tenantId) {
          items = items.filter((o) => o.tenantId === where.tenantId);
        }
        if (where?.status?.in) {
          items = items.filter((o) => where.status!.in!.includes(o.status));
        }
        if (orderBy?.createdAt === 'desc') {
          items = items.sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
          );
        } else if (orderBy?.createdAt === 'asc') {
          items = items.sort(
            (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
          );
        }
        if (include?.lines) {
          return items.map((o) => ({ ...o, lines: o.lines }));
        }
        return items;
      },
      findUnique: async ({
        where,
        include,
      }: {
        where: { id: string };
        include?: Record<string, unknown>;
      }) => {
        const order = allocationOrders.get(where.id);
        if (!order) return null;
        if (include?.commissionEntry) {
          const entry =
            [...commissionLedgers.values()].find(
              (e) => e.allocationOrderId === order.id,
            ) ?? null;
          return { ...order, commissionEntry: entry };
        }
        if (include?.lines) {
          const linesInclude = include.lines as Record<string, unknown>;
          if (linesInclude.include?.masterSku) {
            return {
              ...order,
              lines: order.lines.map((line) => ({
                ...line,
                masterSku: masterSkus.get(line.masterSkuId) ?? {
                  id: line.masterSkuId,
                  skuCode: 'SKU',
                  name: 'Item',
                  quantityOnHand: 1000,
                  isActive: true,
                },
              })),
            };
          }
          return { ...order, lines: order.lines };
        }
        return order;
      },
      findFirst: async ({
        where,
        include,
      }: {
        where: { id?: string; tenantId?: string };
        include?: Record<string, unknown>;
      }) => {
        let order: AllocationOrderRecord | undefined;
        if (where.id) {
          order = allocationOrders.get(where.id);
        } else {
          order = [...allocationOrders.values()].find((o) => {
            if (where.tenantId && o.tenantId !== where.tenantId) return false;
            return true;
          });
        }
        if (!order) return null;
        if (include?.lines) {
          const linesInclude = include.lines as Record<string, unknown>;
          if (linesInclude.include?.masterSku) {
            return {
              ...order,
              lines: order.lines.map((line) => ({
                ...line,
                masterSku: masterSkus.get(line.masterSkuId) ?? {
                  id: line.masterSkuId,
                  skuCode: 'SKU',
                  name: 'Item',
                  quantityOnHand: 1000,
                  isActive: true,
                },
              })),
            };
          }
          return { ...order, lines: order.lines };
        }
        return order;
      },
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const record: AllocationOrderRecord = {
          id: nextId('alloc'),
          tenantId: data.tenantId as string,
          status: (data.status as string) ?? 'DRAFT',
          issuedAt: (data.issuedAt as Date | null) ?? null,
          confirmedAt: (data.confirmedAt as Date | null) ?? null,
          lines: [],
          createdAt: now(),
          updatedAt: now(),
        };
        const nestedLines = (
          data.lines as { create?: Array<Record<string, unknown>> } | undefined
        )?.create;
        if (nestedLines?.length) {
          record.lines = nestedLines.map((line) => ({
            id: nextId('alloc_line'),
            allocationOrderId: record.id,
            masterSkuId: line.masterSkuId as string,
            quantity: line.quantity as number,
            wholesalePrice: line.wholesalePrice as Prisma.Decimal,
          }));
        }
        allocationOrders.set(record.id, record);
        return record;
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Record<string, unknown>;
      }) => {
        const existing = allocationOrders.get(where.id);
        if (!existing) return { id: where.id, ...data, lines: [] };
        const updated = {
          ...existing,
          ...data,
          updatedAt: now(),
        };
        allocationOrders.set(where.id, updated);
        return updated;
      },
    },
    allocationOrderLine: {
      findMany: async () => [],
      aggregate: async () => ({ _sum: { wholesalePrice: null } }),
    },
    procurementReceivingAddress: {
      findMany: async ({
        where,
        orderBy,
      }: {
        where?: { tenantId?: string; isActive?: boolean };
        orderBy?: Array<{ isDefault?: 'asc' | 'desc'; createdAt?: 'asc' | 'desc' }>;
      } = {}) => {
        let items = [...procurementReceivingAddresses.values()];
        if (where?.tenantId) {
          items = items.filter((a) => a.tenantId === where.tenantId);
        }
        if (where?.isActive !== undefined) {
          items = items.filter((a) => a.isActive === where.isActive);
        }
        if (orderBy?.length) {
          items.sort((a, b) => {
            for (const clause of orderBy) {
              if (clause.isDefault) {
                const cmp = Number(b.isDefault) - Number(a.isDefault);
                if (cmp !== 0) return cmp;
              }
              if (clause.createdAt === 'asc') {
                return a.createdAt.getTime() - b.createdAt.getTime();
              }
            }
            return 0;
          });
        }
        return items;
      },
      findFirst: async ({
        where,
        orderBy,
      }: {
        where?: {
          id?: string;
          tenantId?: string;
          isActive?: boolean;
          isDefault?: boolean;
        };
        orderBy?: { createdAt?: 'asc' | 'desc' };
      } = {}) => {
        let items = [...procurementReceivingAddresses.values()];
        if (where?.id) items = items.filter((a) => a.id === where.id);
        if (where?.tenantId) items = items.filter((a) => a.tenantId === where.tenantId);
        if (where?.isActive !== undefined) {
          items = items.filter((a) => a.isActive === where.isActive);
        }
        if (where?.isDefault !== undefined) {
          items = items.filter((a) => a.isDefault === where.isDefault);
        }
        if (orderBy?.createdAt === 'asc') {
          items.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        }
        return items[0] ?? null;
      },
      count: async ({ where }: { where?: { tenantId?: string; isActive?: boolean } } = {}) => {
        let items = [...procurementReceivingAddresses.values()];
        if (where?.tenantId) {
          items = items.filter((a) => a.tenantId === where.tenantId);
        }
        if (where?.isActive !== undefined) {
          items = items.filter((a) => a.isActive === where.isActive);
        }
        return items.length;
      },
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const record: ProcurementReceivingAddressRecord = {
          id: nextId('pra'),
          tenantId: data.tenantId as string,
          label: data.label as string,
          contactName: data.contactName as string,
          contactPhone: data.contactPhone as string,
          address: data.address as string,
          isDefault: (data.isDefault as boolean) ?? false,
          isActive: (data.isActive as boolean) ?? true,
          createdAt: now(),
          updatedAt: now(),
        };
        procurementReceivingAddresses.set(record.id, record);
        return record;
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Record<string, unknown>;
      }) => {
        const existing = procurementReceivingAddresses.get(where.id);
        if (!existing) throw new Error('ProcurementReceivingAddress not found');
        const updated = { ...existing, ...data, updatedAt: now() };
        procurementReceivingAddresses.set(where.id, updated);
        return updated;
      },
      updateMany: async ({
        where,
        data,
      }: {
        where?: { tenantId?: string };
        data: Record<string, unknown>;
      }) => {
        let count = 0;
        for (const [id, row] of procurementReceivingAddresses.entries()) {
          if (where?.tenantId && row.tenantId !== where.tenantId) continue;
          procurementReceivingAddresses.set(id, { ...row, ...data, updatedAt: now() });
          count++;
        }
        return { count };
      },
      delete: async ({ where }: { where: { id: string } }) => {
        procurementReceivingAddresses.delete(where.id);
        return { id: where.id };
      },
    },
    customerDeliveryAddress: {
      findMany: async ({
        where,
        orderBy,
      }: {
        where?: { accountId?: string };
        orderBy?: Array<{ isDefault?: 'asc' | 'desc'; createdAt?: 'asc' | 'desc' }>;
      } = {}) => {
        let items = [...customerDeliveryAddresses.values()];
        if (where?.accountId) {
          items = items.filter((a) => a.accountId === where.accountId);
        }
        if (orderBy?.length) {
          items.sort((a, b) => {
            for (const clause of orderBy) {
              if (clause.isDefault) {
                const cmp = Number(b.isDefault) - Number(a.isDefault);
                if (cmp !== 0) return cmp;
              }
              if (clause.createdAt === 'asc') {
                return a.createdAt.getTime() - b.createdAt.getTime();
              }
            }
            return 0;
          });
        }
        return items;
      },
      findFirst: async ({
        where,
        orderBy,
      }: {
        where?: { id?: string; accountId?: string; isDefault?: boolean };
        orderBy?: { createdAt?: 'asc' | 'desc' };
      } = {}) => {
        let items = [...customerDeliveryAddresses.values()];
        if (where?.id) items = items.filter((a) => a.id === where.id);
        if (where?.accountId) items = items.filter((a) => a.accountId === where.accountId);
        if (where?.isDefault !== undefined) {
          items = items.filter((a) => a.isDefault === where.isDefault);
        }
        if (orderBy?.createdAt === 'asc') {
          items.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        }
        return items[0] ?? null;
      },
      count: async ({ where }: { where?: { accountId?: string } } = {}) => {
        let items = [...customerDeliveryAddresses.values()];
        if (where?.accountId) {
          items = items.filter((a) => a.accountId === where.accountId);
        }
        return items.length;
      },
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const record: CustomerDeliveryAddressRecord = {
          id: nextId('cda'),
          accountId: data.accountId as string,
          label: (data.label as string | null | undefined) ?? null,
          name: data.name as string,
          phone: data.phone as string,
          line1: data.line1 as string,
          line2: (data.line2 as string | null | undefined) ?? null,
          city: data.city as string,
          province: (data.province as string | null | undefined) ?? null,
          postalCode: (data.postalCode as string | null | undefined) ?? null,
          isDefault: (data.isDefault as boolean) ?? false,
          createdAt: now(),
          updatedAt: now(),
        };
        customerDeliveryAddresses.set(record.id, record);
        return record;
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Record<string, unknown>;
      }) => {
        const existing = customerDeliveryAddresses.get(where.id);
        if (!existing) throw new Error('CustomerDeliveryAddress not found');
        const updated = { ...existing, ...data, updatedAt: now() };
        customerDeliveryAddresses.set(where.id, updated);
        return updated;
      },
      updateMany: async ({
        where,
        data,
      }: {
        where?: { accountId?: string };
        data: Record<string, unknown>;
      }) => {
        let count = 0;
        for (const [id, row] of customerDeliveryAddresses.entries()) {
          if (where?.accountId && row.accountId !== where.accountId) continue;
          customerDeliveryAddresses.set(id, { ...row, ...data, updatedAt: now() });
          count++;
        }
        return { count };
      },
      delete: async ({ where }: { where: { id: string } }) => {
        customerDeliveryAddresses.delete(where.id);
        return { id: where.id };
      },
    },
    branchPurchaseOrder: {
      findMany: async ({
        where,
        skip,
        take,
        orderBy,
        include,
      }: {
        where?: { tenantId?: string; status?: string };
        skip?: number;
        take?: number;
        orderBy?: { createdAt: 'asc' | 'desc' };
        include?: { lines?: boolean | { include?: { masterSku?: boolean } } };
      } = {}) => {
        let items = [...branchPurchaseOrders.values()];
        if (where?.tenantId) {
          items = items.filter((o) => o.tenantId === where.tenantId);
        }
        if (where?.status) {
          items = items.filter((o) => o.status === where.status);
        }
        if (orderBy?.createdAt === 'desc') {
          items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }
        if (skip !== undefined) items = items.slice(skip);
        if (take !== undefined) items = items.slice(0, take);
        return items.map((order) => attachBranchPurchaseOrderIncludes(order, include));
      },
      count: async ({ where }: { where?: { tenantId?: string } } = {}) => {
        let items = [...branchPurchaseOrders.values()];
        if (where?.tenantId) {
          items = items.filter((o) => o.tenantId === where.tenantId);
        }
        return items.length;
      },
      findFirst: async ({
        where,
        include,
      }: {
        where?: { id?: string; tenantId?: string };
        include?: { lines?: boolean | { include?: { masterSku?: boolean } }; payment?: boolean };
      } = {}) => {
        const order = [...branchPurchaseOrders.values()].find((o) => {
          if (where?.id && o.id !== where.id) return false;
          if (where?.tenantId && o.tenantId !== where.tenantId) return false;
          return true;
        });
        if (!order) return null;
        return attachBranchPurchaseOrderIncludes(order, include);
      },
      findUnique: async ({
        where,
        include,
      }: {
        where: { id: string };
        include?: {
          lines?: boolean | { include?: { masterSku?: boolean } };
          tenant?: { include?: { merchantProfile?: boolean } };
        };
      }) => {
        const order = branchPurchaseOrders.get(where.id);
        if (!order) return null;
        const result = attachBranchPurchaseOrderIncludes(order, include) as Record<
          string,
          unknown
        >;
        if (include?.tenant) {
          const tenant = tenants.get(order.tenantId);
          result.tenant = tenant
            ? {
                ...tenant,
                merchantProfile: merchantProfiles.get(profileByTenant.get(order.tenantId) ?? ''),
              }
            : null;
        }
        return result;
      },
      create: async ({
        data,
        include,
      }: {
        data: Record<string, unknown>;
        include?: { lines?: boolean | { include?: { masterSku?: boolean } }; payment?: boolean };
      }) => {
        const record: BranchPurchaseOrderRecord = {
          id: nextId('bpo'),
          tenantId: data.tenantId as string,
          warehouseId: data.warehouseId as string,
          orderNumber: data.orderNumber as string,
          status: (data.status as string) ?? 'PENDING_PAYMENT',
          totalAmount: data.totalAmount as Prisma.Decimal,
          note: (data.note as string | null) ?? null,
          paidAt: (data.paidAt as Date | null) ?? null,
          allocationOrderId: (data.allocationOrderId as string | null) ?? null,
          receivingAddressId: (data.receivingAddressId as string | null) ?? null,
          receivingAddressSnapshot:
            (data.receivingAddressSnapshot as Record<string, string> | null) ?? null,
          createdById: data.createdById as string,
          lines: [],
          createdAt: now(),
          updatedAt: now(),
        };
        const nestedLines = (
          data.lines as { create?: Array<Record<string, unknown>> } | undefined
        )?.create;
        if (nestedLines?.length) {
          record.lines = nestedLines.map((line) => ({
            id: nextId('bpo_line'),
            branchPurchaseOrderId: record.id,
            masterSkuId: line.masterSkuId as string,
            quantityOrdered: line.quantityOrdered as number,
            quantityReceived: 0,
            unitWholesalePrice: line.unitWholesalePrice as Prisma.Decimal,
          }));
        }
        branchPurchaseOrders.set(record.id, record);
        return attachBranchPurchaseOrderIncludes(record, include);
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Record<string, unknown>;
      }) => {
        const existing = branchPurchaseOrders.get(where.id);
        if (!existing) return null;
        const updated = { ...existing, ...data, updatedAt: now() };
        branchPurchaseOrders.set(where.id, updated);
        return updated;
      },
    },
    branchPurchaseOrderLine: {
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Record<string, unknown>;
      }) => {
        for (const order of branchPurchaseOrders.values()) {
          const line = order.lines.find((l) => l.id === where.id);
          if (line) {
            Object.assign(line, data);
            return line;
          }
        }
        return null;
      },
    },
    branchPurchaseOrderPayment: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const record: BranchPurchaseOrderPaymentRecord = {
          id: nextId('bpo_pay'),
          branchPurchaseOrderId: data.branchPurchaseOrderId as string,
          amount: data.amount as Prisma.Decimal,
          status: data.status as string,
          provider: (data.provider as string) ?? 'mock',
          paidAt: (data.paidAt as Date | null) ?? null,
          createdAt: now(),
        };
        branchPurchaseOrderPayments.set(record.id, record);
        return record;
      },
    },
    deliveryAllocationLedger: {
      aggregate: async () => ({ _sum: { lineTotal: null } }),
    },
    withdrawalRequest: {
      aggregate: async ({
        where,
        _sum,
      }: {
        where?: { distributorId?: string; status?: WithdrawalRequestStatus };
        _sum?: { amount?: boolean };
      }) => {
        let items = [...withdrawalRequests.values()];
        if (where?.distributorId) {
          items = items.filter((w) => w.distributorId === where.distributorId);
        }
        if (where?.status) {
          items = items.filter((w) => w.status === where.status);
        }
        const amount = items.reduce(
          (acc, w) => acc.plus(w.amount),
          new Prisma.Decimal(0),
        );
        return { _sum: { amount: items.length ? amount : null } };
      },
      findMany: async ({
        where,
        include,
        orderBy,
        skip,
        take,
      }: {
        where?: {
          distributorId?: string;
          status?: WithdrawalRequestStatus;
        };
        include?: { distributor?: { select?: Record<string, boolean> } };
        orderBy?: { createdAt: 'desc' | 'asc' };
        skip?: number;
        take?: number;
      } = {}) => {
        let items = [...withdrawalRequests.values()];
        if (where?.distributorId) {
          items = items.filter((w) => w.distributorId === where.distributorId);
        }
        if (where?.status) {
          items = items.filter((w) => w.status === where.status);
        }
        if (orderBy?.createdAt === 'desc') {
          items = items.sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
          );
        }
        if (skip !== undefined && take !== undefined) {
          items = items.slice(skip, skip + take);
        }
        return items.map((row) => {
          const result: WithdrawalRequestRecord & Record<string, unknown> = {
            ...row,
          };
          if (include?.distributor) {
            const distributor = distributors.get(row.distributorId);
            const select = include.distributor.select;
            if (distributor && select) {
              result.distributor = Object.fromEntries(
                Object.keys(select)
                  .filter((k) => select[k])
                  .map((k) => [k, distributor[k as keyof DistributorRecord]]),
              );
            } else {
              result.distributor = distributor ?? null;
            }
          }
          return result;
        });
      },
      count: async ({
        where,
      }: {
        where?: {
          distributorId?: string;
          status?: WithdrawalRequestStatus;
        };
      } = {}) => {
        let items = [...withdrawalRequests.values()];
        if (where?.distributorId) {
          items = items.filter((w) => w.distributorId === where.distributorId);
        }
        if (where?.status) {
          items = items.filter((w) => w.status === where.status);
        }
        return items.length;
      },
      findFirst: async ({
        where,
      }: {
        where?: { distributorId?: string; status?: WithdrawalRequestStatus };
      }) => {
        let items = [...withdrawalRequests.values()];
        if (where?.distributorId) {
          items = items.filter((w) => w.distributorId === where.distributorId);
        }
        if (where?.status) {
          items = items.filter((w) => w.status === where.status);
        }
        return items[0] ?? null;
      },
      findUnique: async ({
        where,
        include,
      }: {
        where: { id: string };
        include?: { distributor?: boolean };
      }) => {
        const row = withdrawalRequests.get(where.id) ?? null;
        if (!row) return null;
        if (include?.distributor) {
          return {
            ...row,
            distributor: distributors.get(row.distributorId) ?? null,
          };
        }
        return row;
      },
      create: async ({
        data,
      }: {
        data: {
          distributorId: string;
          amount: Prisma.Decimal;
          note?: string | null;
        };
      }) => {
        const record: WithdrawalRequestRecord = {
          id: nextId('wd'),
          distributorId: data.distributorId,
          amount: data.amount,
          status: WithdrawalRequestStatus.PENDING,
          note: data.note ?? null,
          reviewedByPlatformUserId: null,
          rejectionReason: null,
          reviewedAt: null,
          payoutProvider: null,
          payoutReference: null,
          disbursedAt: null,
          payoutError: null,
          createdAt: now(),
          updatedAt: now(),
        };
        withdrawalRequests.set(record.id, record);
        return record;
      },
      update: async ({
        where,
        data,
        include,
      }: {
        where: { id: string };
        data: Partial<WithdrawalRequestRecord>;
        include?: { distributor?: { select?: Record<string, boolean> } };
      }) => {
        const existing = withdrawalRequests.get(where.id);
        if (!existing) throw new Error('Withdrawal not found');
        const updated: WithdrawalRequestRecord = {
          ...existing,
          ...data,
          updatedAt: now(),
        };
        withdrawalRequests.set(where.id, updated);
        const result: WithdrawalRequestRecord & Record<string, unknown> = {
          ...updated,
        };
        if (include?.distributor) {
          const distributor = distributors.get(updated.distributorId);
          const select = include.distributor.select;
          if (distributor && select) {
            result.distributor = Object.fromEntries(
              Object.keys(select)
                .filter((k) => select[k])
                .map((k) => [k, distributor[k as keyof DistributorRecord]]),
            );
          } else {
            result.distributor = distributor ?? null;
          }
        }
        return result;
      },
      updateMany: async ({
        where,
        data,
      }: {
        where?: { id?: string; status?: WithdrawalRequestStatus };
        data: Partial<WithdrawalRequestRecord>;
      }) => {
        let count = 0;
        for (const [id, row] of withdrawalRequests.entries()) {
          if (where?.id && row.id !== where.id) continue;
          if (where?.status && row.status !== where.status) continue;
          withdrawalRequests.set(id, {
            ...row,
            ...data,
            updatedAt: now(),
          });
          count++;
        }
        return { count };
      },
      findUniqueOrThrow: async ({
        where,
        include,
      }: {
        where: { id: string };
        include?: { distributor?: { select?: Record<string, boolean> } };
      }) => {
        const row = withdrawalRequests.get(where.id);
        if (!row) throw new Error('Withdrawal not found');
        if (include?.distributor) {
          const distributor = distributors.get(row.distributorId);
          const select = include.distributor.select;
          return {
            ...row,
            distributor:
              distributor && select
                ? Object.fromEntries(
                    Object.keys(select)
                      .filter((k) => select[k])
                      .map((k) => [
                        k,
                        distributor[k as keyof DistributorRecord],
                      ]),
                  )
                : (distributor ?? null),
          };
        }
        return row;
      },
    },
    merchantRecruitInviteCode: {
      findMany: async ({
        where,
      }: {
        where?: { distributorId?: string };
      } = {}) => {
        let items = [...merchantRecruitInviteCodes.values()];
        if (where?.distributorId) {
          items = items.filter((c) => c.distributorId === where.distributorId);
        }
        return items;
      },
      findFirst: async ({
        where,
        include,
      }: {
        where: {
          code?: string;
          id?: string;
          distributorId?: string;
          revokedAt?: null;
        };
        include?: { distributor?: boolean };
      }) => {
        let items = [...merchantRecruitInviteCodes.values()];
        if (where.code) items = items.filter((c) => c.code === where.code);
        if (where.id) items = items.filter((c) => c.id === where.id);
        if (where.distributorId) {
          items = items.filter((c) => c.distributorId === where.distributorId);
        }
        if (where.revokedAt === null) {
          items = items.filter((c) => c.revokedAt === null);
        }
        const invite = items[0] ?? null;
        if (!invite) return null;
        if (include?.distributor) {
          const distributor = distributors.get(invite.distributorId) ?? null;
          return { ...invite, distributor };
        }
        return invite;
      },
      findUnique: async ({ where }: { where: { code?: string } }) => {
        if (!where.code) return null;
        return (
          [...merchantRecruitInviteCodes.values()].find(
            (c) => c.code === where.code,
          ) ?? null
        );
      },
      create: async ({
        data,
      }: {
        data: Omit<
          MerchantRecruitInviteCodeRecord,
          'id' | 'createdAt' | 'useCount'
        > & {
          useCount?: number;
        };
      }) => {
        const record: MerchantRecruitInviteCodeRecord = {
          id: nextId('inv'),
          useCount: data.useCount ?? 0,
          createdAt: now(),
          revokedAt: data.revokedAt ?? null,
          expiresAt: data.expiresAt ?? null,
          code: data.code,
          distributorId: data.distributorId,
        };
        merchantRecruitInviteCodes.set(record.id, record);
        return record;
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<MerchantRecruitInviteCodeRecord>;
      }) => {
        const existing = merchantRecruitInviteCodes.get(where.id);
        if (!existing) throw new Error('Invite not found');
        const updated = { ...existing, ...data };
        merchantRecruitInviteCodes.set(where.id, updated);
        return updated;
      },
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
    _seedPlatformAdmin: async (
      email: string,
      password: string,
      role: PlatformRole,
    ) => {
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
      options?: { isFlagship?: boolean },
    ) => {
      const tenant = await mock._seedApprovedTenant(slug, businessName);
      if (options?.isFlagship !== false) {
        await mock.merchantProfile.update({
          where: { tenantId: tenant.id },
          data: { isFlagship: true },
        });
      }
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
    _seedConfirmedAllocation: async (input: {
      tenantId: string;
      lines: Array<{ quantity: number; wholesalePrice: number }>;
    }) => {
      const allocId = nextId('alloc');
      const lines: AllocationOrderLineRecord[] = input.lines.map(
        (line, index) => ({
          id: nextId('alloc-line'),
          allocationOrderId: allocId,
          masterSkuId: nextId('msku'),
          quantity: line.quantity,
          wholesalePrice: new Prisma.Decimal(line.wholesalePrice),
        }),
      );
      const record: AllocationOrderRecord = {
        id: allocId,
        tenantId: input.tenantId,
        status: 'CONFIRMED',
        issuedAt: now(),
        confirmedAt: now(),
        lines,
        createdAt: now(),
        updatedAt: now(),
      };
      allocationOrders.set(allocId, record);
      return record;
    },
    _seedFlagshipCatalog: async (input: {
      flagshipSlug: string;
      branchSlug: string;
      sku: {
        skuCode: string;
        name: string;
        wholesalePrice: number;
        retailPrice: number;
        flagshipPrice: number;
        branchInventory?: number;
      };
    }) => {
      const flagshipTenant = await mock._seedApprovedTenant(
        input.flagshipSlug,
        'Flagship',
      );
      await mock.merchantProfile.update({
        where: { tenantId: flagshipTenant.id },
        data: { isFlagship: true, storePublished: true },
      });
      const branchTenant = await mock._seedApprovedTenant(
        input.branchSlug,
        'Branch',
      );
      await mock.merchantProfile.update({
        where: { tenantId: branchTenant.id },
        data: { storePublished: true },
      });

      const masterSku = await mock.masterSku.create({
        data: {
          skuCode: input.sku.skuCode,
          name: input.sku.name,
          quantityOnHand: 100,
          unitCost: new Prisma.Decimal(10),
          wholesalePrice: new Prisma.Decimal(input.sku.wholesalePrice),
          retailPrice: new Prisma.Decimal(input.sku.retailPrice),
          flagshipPrice: new Prisma.Decimal(input.sku.flagshipPrice),
        },
      });

      const flagshipProduct = await mock.product.create({
        data: {
          tenantId: flagshipTenant.id,
          name: input.sku.name,
          slug: input.sku.skuCode.toLowerCase(),
          isPublished: true,
        },
      });
      const flagshipVariant = await mock.productVariant.create({
        data: {
          productId: flagshipProduct.id,
          masterSkuId: masterSku.id,
          sku: input.sku.skuCode,
          name: input.sku.name,
          price: new Prisma.Decimal(input.sku.flagshipPrice),
          inventory: 0,
          isActive: true,
        },
      });

      const branchProduct = await mock.product.create({
        data: {
          tenantId: branchTenant.id,
          name: input.sku.name,
          slug: input.sku.skuCode.toLowerCase(),
          isPublished: true,
        },
      });
      const branchVariant = await mock.productVariant.create({
        data: {
          productId: branchProduct.id,
          masterSkuId: masterSku.id,
          sku: input.sku.skuCode,
          name: input.sku.name,
          price: new Prisma.Decimal(input.sku.retailPrice),
          inventory: input.sku.branchInventory ?? 5,
          isActive: true,
        },
      });

      return {
        masterSku,
        flagshipTenant,
        branchTenant,
        flagshipProduct,
        flagshipVariant,
        branchProduct,
        branchVariant,
      };
    },
  };

  return mock;
}

export type MockPrisma = ReturnType<typeof createMockPrisma>;
