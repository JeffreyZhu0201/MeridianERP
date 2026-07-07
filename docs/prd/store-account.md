# Store Account — PRD

**Version:** 1.0.0  
**Updated:** 2026-07-06

## Overview

Consumers with a platform account (`PlatformAccount`) can manage saved delivery addresses and profile settings from `/shop/account`. Addresses are global across the unified flagship store; checkout may prefill the default address for delivery orders.

## User Stories

### US-SA1 — Address book (P0)

As a logged-in consumer, I can add, edit, delete, and set a default delivery address so checkout is faster.

**Acceptance:**

- **Given** I am authenticated, **When** I open `/shop/account/addresses`, **Then** I see my saved addresses with one marked default.
- **Given** I create an address, **When** it is my first address or I set `isDefault`, **Then** it becomes the only default.
- **Given** I delete the default address, **When** other addresses exist, **Then** the earliest remaining address becomes default.

### US-SA2 — Account settings (P0)

As a logged-in consumer, I can update my name and phone and change my password.

**Acceptance:**

- **Given** I PATCH `/store/auth/me`, **When** fields are valid, **Then** `firstName`, `lastName`, and `phone` persist on `PlatformAccount`.
- **Given** I POST `/store/auth/change-password` with wrong current password, **When** submitted, **Then** API returns 401.
- **Given** correct current password, **When** new password meets policy, **Then** password updates and I can log in with the new password.

### US-SA3 — Sidebar navigation (P0)

As a logged-in consumer, I can switch between Orders, Addresses, and Settings with correct active state.

**Acceptance:**

- Routes: `/shop/account`, `/shop/account/addresses`, `/shop/account/settings`.
- Unauthenticated access redirects to login with `from` param.

### US-SA4 — Checkout prefill (P1)

As a logged-in consumer checking out with delivery, my default saved address pre-fills the delivery form.

**Acceptance:**

- **Given** a default address exists, **When** checkout loads with delivery fulfillment, **Then** form fields match the default address.
- **Given** no saved addresses, **When** checkout loads, **Then** fields remain empty.

## Out of scope

- Editing addresses on past orders
- International address validation services
- Third-party address autocomplete
