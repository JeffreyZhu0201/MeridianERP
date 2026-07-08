# Admin Master SKU Editor — Design

**Version:** 1.0.0

## Routes

| Route | Purpose |
|-------|---------|
| `/inventory/master-catalog` | SKU list + quick create |
| `/inventory/master-catalog/[id]` | Full editor (tabs) |

## Tabs

1. **Basic** — skuCode (read-only), name, prices, onHand, isActive
2. **Description** — Markdown editor (`@uiw/react-md-editor`)
3. **Images** — `ImageUploadGallery` with primary + sort
4. **Preview** — `MarkdownContent` read-only

## Shared components (`packages/ui`)

- `MarkdownEditor` — dynamic import, no SSR
- `MarkdownContent` — `react-markdown` + `remark-gfm`
- `ImageUploadGallery` — multipart upload to platform media API

## Store PDP

- Image gallery with primary selection
- `MarkdownContent` for description
- Fallback gradient when no images
