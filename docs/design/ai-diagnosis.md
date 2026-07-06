# AI Diagnosis — Admin Screen

**Route:** `/diagnosis`  
**Roles:** `SUPER_ADMIN`, `FINANCE`  
**Shell:** `AdminShell` via `AdminShellWithSession`

## Layout

Uses `ListPageFrame` from `@meridian/ui/server`:

1. **Query area** — multiline input + primary submit button.
2. **Loading** — disabled submit + skeleton or spinner while awaiting API.
3. **Results** — when `DiagnosisResult` returns:
   - Report paragraph (`report`, `text-sm`, `whitespace-pre-wrap`).
   - Card grid: each `DiagnosisCard` in a `Card` with domain title, `Badge` for `status` (`normal` / `warning` / `error`).
   - Optional collapsible `detail` JSON per card.

## States

| State | UI |
|-------|-----|
| Empty | Placeholder prompt examples (order id, merchant slug, commission question) |
| Loading | Submit disabled |
| Success | Report + cards |
| Error | `Alert` destructive with API message |

## i18n keys

Namespace `admin.diagnosis` in `packages/shared/src/i18n/messages/{zh-CN,en}/admin.ts`.

## Components

- `apps/admin/app/diagnosis/page.tsx` — server shell
- `apps/admin/app/diagnosis/_components/diagnosis-panel.tsx` — client form + results (`'use client'`)
