# Admin Master SKU Editor — Design

**Version:** 1.0.1

## Routes

| Route | Purpose |
|-------|---------|
| `/inventory/master-catalog` | SKU list + quick create |
| `/inventory/master-catalog/[id]` | Full editor (tabs) |

## Layout

- `DetailPageFrame` with breadcrumb back to list, title, skuCode description, save action
- Save success toast; save disabled while images upload

## Tabs

1. **Basic** — name, short summary, prices, onHand, isActive (skuCode shown in frame description)
2. **Description** — Markdown editor (`@uiw/react-md-editor`)
3. **Images** — `ImageUploadGallery` with primary, alt text, up/down reorder
4. **Preview** — `MarkdownContent` read-only

## Shared components (`packages/ui`)

- `MarkdownEditor` — dynamic import, no SSR
- `MarkdownContent` — `react-markdown` + `remark-gfm` (requires `@tailwindcss/typography` in consuming apps)
- `ImageUploadGallery` — `onUpload` callback; parent wires platform media API

## List table

- Thumbnail column (40×40 primary image or muted placeholder)

## Store PDP

- Image gallery with primary selection
- `MarkdownContent` for description
- Fallback gradient when no images
