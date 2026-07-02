export function slugify(value: string): string {
  if (!value) return 'merchant';
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')   // 非字母数字字符替换为 -
    .replace(/^-+|-+$/g, '')       // 去除首尾的 -
    .slice(0, 48);                 // 最多 48 字符
}

export function draftSlug(): string {
  return `draft-${Date.now().toString(36)}`;
}
