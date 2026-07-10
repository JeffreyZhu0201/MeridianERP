import type { FulfillmentType } from './phase-5-distribution.js';
export type OrderListTab = 'all' | 'pickup' | 'delivery';
export interface OrderListRow {
    id: string;
    customerLabel: string;
    status: string;
    fulfillmentType: FulfillmentType;
    total: string;
    createdAt: string;
    meta?: string;
}
export declare function formatPickupCodeHint(pickupCode: string | null | undefined): string | undefined;
