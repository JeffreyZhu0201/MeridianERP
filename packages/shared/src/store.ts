/**
 * 商店前端相关类型定义
 * 供消费者访问的商店页面使用
 */

/**
 * 发布的商店信息
 * US-5.1 商店选择器：消费者可访问的已发布商店列表
 * @property slug - 商店 URL 标识（唯一）
 * @property displayName - 商店显示名称
 */
export interface PublishedStore {
  slug: string;
  displayName: string;
}

/**
 * 商店列表响应
 * @property items - 商店条目列表
 */
export interface PublishedStoreListResponse {
  items: PublishedStore[];
}
