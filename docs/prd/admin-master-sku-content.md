# Admin Master SKU Content — PRD

**Version:** 1.0.0  
**Updated:** 2026-07-07

## Problem

HQ operators manage catalog via Master SKU dialogs with pricing/inventory only. Consumer storefront shows placeholder images and plain text — no rich product content pipeline from HQ.

## Users

| User | Portal | Need |
|------|--------|------|
| HQ fulfillment / super admin | `apps/admin` | Upload images, write Markdown descriptions on Master SKU |
| End customer | `apps/store` | See product images and formatted descriptions |

## User Stories (P0)

### US-AMSC1 — Edit Master SKU content page

**Given** I am on `/inventory/master-catalog/[id]`  
**When** I save description and images  
**Then** content persists on MasterSku and syncs to flagship Product

### US-AMSC2 — Image upload

**Given** `MEDIA_STORAGE=local`  
**When** I upload a JPEG/PNG ≤5MB  
**Then** I receive a public URL and can assign as primary image

### US-AMSC3 — Store display

**Given** a synced flagship product with images and Markdown description  
**When** I browse the unified store catalog  
**Then** I see `primaryImageUrl` on cards and rendered Markdown on PDP

### US-AMSC4 — Branch allocation inherit

**Given** a branch confirms an allocation for a new Master SKU  
**When** branch Product is created  
**Then** description and image URLs are copied from Master SKU

## Out of scope

- Multi-variant matrix, HQ categories, CDN transforms, merchant-side rich edit, CSV import
