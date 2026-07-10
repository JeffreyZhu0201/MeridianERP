export interface ProcurementReceivingAddress {
    id: string;
    tenantId: string;
    label: string;
    contactName: string;
    contactPhone: string;
    address: string;
    isDefault: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface ProcurementReceivingAddressSnapshot {
    label: string;
    contactName: string;
    contactPhone: string;
    address: string;
}
export interface CreateProcurementReceivingAddressRequest {
    label: string;
    contactName: string;
    contactPhone: string;
    address: string;
    isDefault?: boolean;
}
export interface UpdateProcurementReceivingAddressRequest {
    label?: string;
    contactName?: string;
    contactPhone?: string;
    address?: string;
    isDefault?: boolean;
    isActive?: boolean;
}
