# Platform Settings — UI Design

**Framework:** `SettingsPageFrame` (FW-SETTINGS)  
**Reference:** `packages/ui` form controls and card components

## Merchant `/settings`

Stacked Cards inside `SettingsPageFrame`:

1. **Business profile** — Input fields (businessName, contactEmail, contactPhone)
2. **Team** — Table + "Invite staff" Dialog
3. **Commission defaults** — rate + type Select
4. **Notifications** — Switch toggles
5. **Store & payments** — read-only Badge (mock/live), copy store URL

## Admin `/settings`

1. **Platform** — platformName, supportEmail
2. **Payments** — Stripe status card (no secret inputs)
3. **Features** — optional toggles (distributor portal enabled)
