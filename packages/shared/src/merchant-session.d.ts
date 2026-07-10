export interface MerchantSession {
    id: string;
    email: string;
    role: string;
    firstName: string | null;
    lastName: string | null;
    displayName: string;
}
export declare function merchantDisplayName(input: {
    firstName: string | null;
    lastName: string | null;
    email: string;
}): string;
export declare function userInitials(displayName: string, email: string): string;
