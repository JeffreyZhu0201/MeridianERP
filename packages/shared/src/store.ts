/** Public store entry for US-5.1 store picker. */
export interface PublishedStore {
  slug: string;
  displayName: string;
}

export interface PublishedStoreListResponse {
  items: PublishedStore[];
}
