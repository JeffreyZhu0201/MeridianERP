# Unified User Identity — Design

**Apps:** `apps/admin`, `apps/store`  
**Shells:** `AdminShell`, `AuthLayout`

## Admin — Users List (`/users`)

**Layout:** `ListPageFrame` + `BentoListHeader` + filters + table.

| Element | Spec |
|---------|------|
| Title | "Users" |
| Filters | Search input (email/name); identity multi-select |
| Table columns | Email, Name, Identities (Badge group), Merchants, Registered |
| Row action | View detail |
| Pagination | 20 per page |
| Empty | `EmptyState` "No users found" |

**Identity badges:** `CONSUMER` default, `MERCHANT_OWNER` primary, `MERCHANT_STAFF` secondary, `DISTRIBUTOR` outline, `PLATFORM_ADMIN` destructive outline.

## Admin — User Detail (`/users/[id]`)

| Section | Content |
|---------|---------|
| Header | email, full name, registeredAt |
| Identities | Badge list |
| Consumer profiles | Table: tenant slug, businessName, order count |
| Merchant roles | Table: businessName, role, onboarding status |

## Admin — Create Merchant (`/merchants/new`)

**Layout:** `ListPageFrame` with form card.

| Field | Spec |
|-------|------|
| businessName | Required text |
| legalName | Optional |
| contactEmail | Required email |
| contactPhone | Optional |
| slug | Optional; helper "Auto-generated from business name if empty" |
| owner | Combobox/async search against `GET /platform/users?search=`; shows email + name |
| recruitedByDistributorId | Optional select (reuse distributor list) |
| Actions | Cancel → `/merchants`; Submit primary "Create merchant" |

**Success:** toast + redirect `/merchants/[id]`.

**Merchants list:** Add primary button "Add merchant" → `/merchants/new`.

## Store — Global Register (`/register`)

**Layout:** `AuthLayout` centered card (match slug register).

| Fields | email, password, firstName, lastName (optional) |
| CTA | "Create account" |
| Link | "Already have an account? Sign in" → `/login` |
| Post-submit | Set `store_token` cookie; redirect `/` (store picker) |

## Store — Global Login (`/login`)

Same layout; redirect `/` or `from` query param.

## Navigation

- `AdminShell` nav: add `users` item with `IconUsers` before `merchants`.
- Store picker + slug pages: login/register links point to `/login` and `/register`.

## Component Mapping

| UI | Path |
|----|------|
| UsersTable | `apps/admin/app/users/_components/users-table.tsx` |
| UsersFilters | `apps/admin/app/users/_components/users-filters.tsx` |
| CreateMerchantForm | `apps/admin/app/merchants/new/_components/create-merchant-form.tsx` |
| GlobalRegister | `apps/store/app/register/page.tsx` |
| GlobalLogin | `apps/store/app/login/page.tsx` |

## States

All screens: loading skeleton, inline validation errors, API error Alert, empty states per `packages/ui` patterns.
