# Distributor Self-Service Portal — PRD (US-4.10)

**Version:** 1.0  
**Status:** P2 — approved for implementation

## Problem

Distributor agents cannot view their bindings, attributed orders, or commission without merchant staff.

## Solution

New app `apps/distributor` (port 3005) with fourth JWT realm `aud: distributor`.

## User Stories

| ID | Story | Acceptance |
|----|-------|------------|
| US-DP1 | Merchant owner enables portal for distributor | Set password, portalEnabled=true |
| US-DP2 | Distributor logs in | POST `/distributor/auth/login` → JWT |
| US-DP3 | Distributor views dashboard | Bindings count, orders, commission summary (read-only) |
| US-DP4 | Distributor views commission lines | Filtered ledger for own distributorId |

## Non-Goals

- Payout initiation, QR generation, binding management
