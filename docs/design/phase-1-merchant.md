# Phase 1 — Merchant Portal Design

**App:** `apps/merchant`  
**Port:** 3002  
**Shell:** `MerchantShell`

## Figma

- File: TBD (create on first implementation via ui-designer)
- Frames: see table below

| Frame | Node ID | React route |
|-------|---------|-------------|
| Register | TBD | `/register` |
| Login | TBD | `/login` |
| Onboarding pending | TBD | `/onboarding/pending` |
| Dashboard | TBD | `/` |
| Contacts list | TBD | `/crm/contacts` |
| Companies list | TBD | `/crm/companies` |
| Leads list | TBD | `/crm/leads` |
| Distributors list | TBD | `/distributors` |
| Distributor detail + QR | TBD | `/distributors/[id]` |
| Bind page | TBD | `/bind/[token]` |

---

## Screen Specifications

### Register (`/register`)

**Layout:** Centered card, multi-step wizard (3 steps).

| Step | Fields |
|------|--------|
| 1. Account | Email, Password, Confirm Password |
| 2. Business | Business Name, Legal Name, Contact Phone |
| 3. Review | Summary read-only, Terms checkbox |

**Navigation:** Back / Next buttons. Final step: "Submit Application" primary CTA.  
**Success:** Redirect to `/onboarding/pending`.

### Login (`/login`)

Same pattern as admin login. Title: "Merchant Portal".  
Link below form: "Don't have an account? Register"

### Onboarding Pending (`/onboarding/pending`)

**Layout:** Centered message card, no sidebar.

- Icon: `IconClock` muted
- Title: "Application Under Review"
- Body: "We'll notify you at {email} once approved."
- Status badge showing current onboardingStatus

### Dashboard (`/`)

| Section | Content |
|---------|---------|
| Welcome | "Welcome, {businessName}" |
| Metric row | Contacts count, Open Leads, Active Distributors, Recent Bindings |
| Recent leads | DataTable: title, stage badge, source, createdAt |
| Quick actions | "Add Contact", "Add Distributor" buttons |

### CRM — Contacts (`/crm/contacts`)

| Element | Spec |
|---------|------|
| Header | "Contacts" + "Add Contact" button |
| Table | firstName, lastName, email, phone, company, actions |
| Add/Edit | Sheet side panel with form |
| Empty | "No contacts yet" + "Add your first contact" CTA |

### CRM — Companies (`/crm/companies`)

Same pattern as contacts. Columns: name, website, contact count, actions.

### CRM — Leads (`/crm/leads`)

| Element | Spec |
|---------|------|
| Table | title, stage (Badge), source, contact, distributor, updatedAt |
| Stage filter | Tabs or select: All, New, Qualified, Won, Lost |
| Stage change | DropdownMenu on row or detail Sheet |
| Add lead | Sheet form: title, contact (select), source |

**Stage badge colors:** NEW=info, QUALIFIED=warning, WON=success, LOST=destructive

### Distributors (`/distributors`)

| Element | Spec |
|---------|------|
| Header | "Distributors" + "Add Distributor" |
| Table | name, email, commissionRate + type, isActive, bindings count, actions |
| Add/Edit | Dialog form: name, email, phone, commissionType (select), commissionRate (number) |

### Distributor Detail + QR (`/distributors/[id]`)

| Section | Content |
|---------|---------|
| Header | Distributor name, Edit button |
| Commission card | Rate display, type label |
| QR section | Generated QR image (256x256), "Copy Link" button, expiry date |
| Bindings table | bindableType, boundAt, linked lead |
| Generate QR | "Generate New QR" button (creates new token, invalidates display) |

### Bind Page (`/bind/[token]`) — Mobile-first

**Layout:** Full viewport, no sidebar. `min-h-dvh`, centered card `max-w-md px-4`.

| State | UI |
|-------|-----|
| Loading | Skeleton card |
| Valid token | Distributor name, "Bind to this distributor?" + Confirm CTA (min-h-11) |
| Requires login | "Sign in to complete binding" + Login CTA |
| Success | Checkmark, "Successfully bound", link to dashboard |
| Expired/invalid | Error message, "Contact your distributor for a new code" |

**Touch targets:** All buttons `min-h-11` (44px). Primary CTA full width.

---

## Component Mapping

| UI element | Code path |
|------------|-----------|
| MerchantShell | `packages/ui/components/shells/merchant-shell.tsx` |
| RegisterWizard | `apps/merchant/app/(auth)/register/_components/register-wizard.tsx` |
| ContactsTable | `apps/merchant/app/(crm)/contacts/_components/contacts-table.tsx` |
| LeadsTable | `apps/merchant/app/(crm)/leads/_components/leads-table.tsx` |
| DistributorsTable | `apps/merchant/app/(distributors)/distributors/_components/distributors-table.tsx` |
| QrDisplay | `apps/merchant/app/(distributors)/distributors/_components/qr-display.tsx` |
| BindPage | `apps/merchant/app/bind/[token]/page.tsx` |

---

## Tokens

See `docs/design/design-system.md`. Merchant portal shares tokens via `packages/ui/styles/globals.css`.
