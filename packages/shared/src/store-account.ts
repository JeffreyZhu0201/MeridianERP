import type { DeliveryAddress } from './phase-5-fulfillment.js';

export interface CustomerDeliveryAddressRow extends DeliveryAddress {
  id: string;
  label: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerDeliveryAddressBody extends DeliveryAddress {
  label?: string;
  isDefault?: boolean;
}

export interface UpdateCustomerDeliveryAddressBody {
  label?: string;
  name?: string;
  phone?: string;
  line1?: string;
  line2?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  isDefault?: boolean;
}

export interface UpdateStoreCustomerProfileBody {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface ChangeStorePasswordBody {
  currentPassword: string;
  newPassword: string;
}
