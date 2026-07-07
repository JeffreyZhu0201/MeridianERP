# CRM AI Follow-up — PRD

**Version:** 1.0.0  
**Updated:** 2026-07-07

## Problem

Branch merchants using the CRM plugin often lack clear next actions on leads and contacts. Staff must manually review stage, source, and activity history to decide follow-up timing and messaging — slow and inconsistent.

## Users

| User | Portal | Need |
|------|--------|------|
| Branch merchant owner / staff | `apps/merchant` | On-demand AI suggestions for CRM follow-up on lead and contact detail pages |

## User Stories

### US-CAI1 — Generate follow-up suggestion on lead detail (P0)

**Given** CRM is installed and I am on `/crm/leads/[id]`  
**When** I click「生成建议」  
**Then** I see a read-only panel with summary, next steps, and talking points grounded in the lead stage and recent activities

### US-CAI2 — Generate follow-up suggestion on contact detail (P0)

**Given** CRM is installed and I am on `/crm/contacts/[id]`  
**When** I click「生成建议」  
**Then** I see the same structured suggestion based on contact + related leads + activities

### US-CAI3 — CRM plugin gate (P0)

**Given** CRM is uninstalled  
**When** I call `POST /merchant/crm/ai/follow-up`  
**Then** I receive `403 PLUGIN_NOT_INSTALLED`

### US-CAI4 — Tenant isolation (P0)

**Given** I am tenant A  
**When** I request follow-up for tenant B's lead id  
**Then** I receive `404`

## Out of scope (v1)

- Auto-creating CRM activities from AI output
- List-page bulk AI summaries
- New merchant plugin code (extends existing `crm` plugin)

## Success metrics

- Merchant can generate a suggestion in &lt; 5s (mock) or &lt; 15s (live)
- Suggestion references lead stage and activity count in `sources`
