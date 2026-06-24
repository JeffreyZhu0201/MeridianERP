export function slugify(value: string): string {
  if (!value) return 'merchant';
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export function draftSlug(): string {
  return `draft-${Date.now().toString(36)}`;
}
