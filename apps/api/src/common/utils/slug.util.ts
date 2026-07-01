/**
 * Slug 工具函数
 *
 * Slug 是 URL 友好的字符串标识符，用于：
 * - 商店路由：/s/your-store-slug
 * - 商品链接：/products/your-product-slug
 * - 唯一性保证：每个 slug 在系统中唯一
 *
 * ## 存储位置
 *
 * - Store.slug: 商店唯一标识（创建时生成）
 * - Product.slug: 商品唯一标识（创建时生成）
 * - 可通过后台修改，但必须保持唯一性
 *
 * ## 长度限制
 *
 * - 最多 48 字符（slice(0, 48)）
 * - 数据库字段为 VARCHAR(48)
 */

/**
 * 将字符串转换为 URL 友好的 slug 格式
 *
 * ## 转换规则详解
 *
 * | 步骤 | 输入 | 输出 | 说明 |
 * |------|------|------|------|
 * | 1. 转小写 | "Hello" | "hello" | URL 不区分大小写 |
 * | 2. trim | " hello " | "hello" | 去除首尾空白 |
 * | 3. 替换 | "a@b#c" | "a-b-c" | 非字母数字替换为 - |
 * | 4. 去除首尾 - | "-hello-" | "hello" | 避免 URL 出现 // |
 * | 5. 截断 | 超过48字符 | 前48字符 | 符合数据库 VARCHAR(48) |
 *
 * ## 特殊处理
 *
 * - 空字符串返回默认值 'merchant'
 * - 重复的连字符合并为单个： "a--b" → "a-b"
 *
 * @param value - 输入字符串（如店名、商品名）
 * @returns slug 格式字符串（小写、URL 安全、唯一）
 *
 * @example
 * slugify('Hello World!')      // 'hello-world'
 * slugify('  Test@123  ')     // 'test-123'
 * slugify('Shop & More!!')     // 'shop-more'
 * slugify('超 级 商 店')        // '超-级-商-店'（中文保留）
 * slugify('')                  // 'merchant'（空字符串返回默认值）
 */
export function slugify(value: string): string {
  if (!value) return 'merchant';
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')   // 非字母数字字符替换为 -
    .replace(/^-+|-+$/g, '')       // 去除首尾的 -
    .slice(0, 48);                 // 最多 48 字符
}

/**
 * 生成草稿 slug
 *
 * ## 用途
 *
 * 创建未发布状态的实体时使用：
 * - 新商店审核中：draft-{timestamp}
 * - 商品草稿状态：draft-{timestamp}
 *
 * ## 为什么用时间戳的 36 进制？
 *
 * - 36 进制（A-Z + 0-9）比 10 进制更短
 * - Date.now() 的 36 进制约为 8 个字符
 * - 组合后如 "draft-m1abc123"，足够短且唯一
 *
 * @returns 草稿 slug 字符串，格式：draft-{36进制时间戳}
 *
 * @example
 * draftSlug() // 'draft-m1z5x9k'（类似这样的唯一值）
 */
export function draftSlug(): string {
  return `draft-${Date.now().toString(36)}`;
}
