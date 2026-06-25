# Platform Settings — PRD

**Version:** 1.0  
**Last updated:** 2025-06-25  
**Status:** Approved for implementation

## Problem

Admin and Merchant `/settings` are placeholders. Merchants need team management, commission defaults, notification prefs, and payment status visibility. Platform admins need configurable platform identity and payment health indicators.

## User Stories (P0)

| ID | Story | Acceptance |
|----|-------|------------|
| US-S1 | Merchant owner edits business profile | PATCH businessName, contactEmail, contactPhone on MerchantProfile |
| US-S2 | Merchant owner manages team | List users; create MERCHANT_STAFF; deactivate staff |
| US-S3 | Merchant owner sets default commission for new distributors | TenantSettings defaultCommissionRate/Type applied on distributor create |
| US-S4 | Merchant owner toggles email notifications | notifyOnBinding, notifyOnCommission persisted |
| US-S5 | Merchant views payment/store link | Read-only Stripe mode (mock/live), store URL from tenant slug |
| US-S6 | Platform admin edits platform info | platformName, supportEmail on PlatformSettings singleton |
| US-S7 | Platform admin views Stripe status | Masked key hint, webhook URL doc, mock/live badge |

## Non-Goals

- Stripe Connect per tenant
- Storing Stripe secrets in UI/DB
- Email invite links with magic tokens (v1: owner sets temp password)

## Success Metrics

- Settings pages load < 500ms p95
- RBAC: Staff cannot PATCH settings or manage team
- 100% P0 covered by API e2e
