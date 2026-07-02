# Phase 1 — Super Admin Portal Design

**App:** `apps/admin`  
**Port:** 3000  
**Shell:** `AdminShell`

## Screen Specifications

### Login (`/login`)

**Layout:** Centered card on muted background, no sidebar.

| Element | Spec |
|---------|------|
| Card width | `max-w-sm` |
| Logo | MeridianERP wordmark, `text-xl font-semibold` |
| Title | "Platform Admin" `text-lg font-medium` |
| Fields | Email, Password |
| CTA | "Sign in" primary pill button, full width |
| Error | Inline below form, `text-destructive text-sm` |

### Dashboard (`/`)

**Layout:** AdminShell with metric cards + recent activity.

| Section | Content |
|---------|---------|
| Metric row | 4 cards: Total Merchants, Pending Review, Active Distributors, Bindings (30d) |
| Recent merchants | DataTable: businessName, status badge, submittedAt, action (View) |
| Empty state | "No merchants yet" + link to docs |

**Metric card:** shadcn Card, `p-4`, title `text-sm text-muted-foreground`, value `text-2xl font-semibold`.

### Merchants List (`/merchants`)

**Layout:** Page title + filter bar + DataTable.

| Element | Spec |
|---------|------|
| Title | "Merchants" |
| Filters | Status select (All, Submitted, Under Review, Approved, Rejected), search input |
| Table columns | Business Name, Contact Email, Status (Badge), Submitted, Actions |
| Row action | DropdownMenu: View, Approve (if SUBMITTED), Reject (if SUBMITTED) |
| Pagination | Bottom, 20 per page |

### Merchant Detail (`/merchants/[id]`)

**Layout:** Two-column on desktop, single on mobile.

| Section | Content |
|---------|---------|
| Header | businessName `text-2xl`, status Badge, action buttons (Approve / Reject) |
| Profile card | legalName, contactEmail, contactPhone, submittedAt, reviewedAt |
| Rejection | If REJECTED: Alert with rejectionReason |
| Tabs | Overview, CRM Summary (read-only counts), Distributors (read-only list) |

**Approve flow:** Dialog confirmation → toast success → redirect to list.  
**Reject flow:** Dialog with required rejectionReason textarea → toast → redirect.

---

## Component Mapping

| UI element | Code path |
|------------|-----------|
| AdminShell | `packages/ui/components/shells/admin-shell.tsx` |
| MetricCard | `packages/ui/components/metric-card.tsx` |
| MerchantsTable | `apps/admin/app/(merchants)/merchants/_components/merchants-table.tsx` |
| MerchantDetail | `apps/admin/app/(merchants)/merchants/[id]/page.tsx` |
| ApproveDialog | `apps/admin/app/(merchants)/merchants/_components/approve-dialog.tsx` |
| RejectDialog | `apps/admin/app/(merchants)/merchants/_components/reject-dialog.tsx` |
| LoginForm | `apps/admin/app/(auth)/login/_components/login-form.tsx` |

---

## Tokens

See `docs/design/design-system.md` for full token reference. Admin uses default platform theme (no per-tenant branding in Phase 1).
