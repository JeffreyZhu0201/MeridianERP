# CRM AI Follow-up — Design

**Routes:** `/crm/leads/[id]`, `/crm/contacts/[id]`  
**Plugin:** `crm` (no new plugin card)

## Component

`apps/merchant/app/crm/_components/crm-ai-follow-up-panel.tsx`

Props: `{ token: string; leadId?: string; contactId?: string }`

## Layout

Below the Profile `Card` on detail pages:

1. **Card** header: sparkle icon +「AI 跟进建议」+ `Badge`「只读」
2. **Generate** button (secondary) — on-demand, not auto
3. **Results:** `summary` paragraph; numbered `nextSteps`; bullet `talkingPoints`; optional `stageInsight` / `risks`

## States

| State | UI |
|-------|-----|
| Idle | Button enabled |
| Loading | Button disabled + loading text |
| Success | Structured lists |
| Error | `Alert` destructive |

## i18n

Namespace `merchant.crm.ai` in `packages/shared/src/i18n/messages/{zh-CN,en}/merchant.ts`
