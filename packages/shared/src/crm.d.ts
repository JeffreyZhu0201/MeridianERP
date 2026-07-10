import type { ActivityType } from './enums.js';
export interface CrmActivity {
    id: string;
    tenantId: string;
    contactId: string | null;
    leadId: string | null;
    type: ActivityType;
    note: string;
    createdAt: string;
    contact?: {
        id: string;
        firstName: string;
        lastName: string;
        email?: string | null;
    } | null;
}
export interface CreateActivityRequest {
    type: ActivityType;
    note: string;
    contactId?: string;
    leadId?: string;
}
export interface DeleteActivityResponse {
    deleted: true;
}
export interface CrmStoreCustomerListItem {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    completedOrderCount: number;
    totalSpent: string | number;
    lastOrderAt: string;
}
