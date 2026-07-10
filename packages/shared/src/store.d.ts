export interface PublishedStore {
    slug: string;
    displayName: string;
    isFlagship: boolean;
}
export interface PublishedStoreListResponse {
    items: PublishedStore[];
}
