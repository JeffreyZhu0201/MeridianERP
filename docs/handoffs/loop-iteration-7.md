## Loop iteration 7 — 2026-07-04

**Trigger:** Manual continue after loop stopped

### Changes shipped

| Area | Change |
|------|--------|
| `StoreCatalogToolbar` | Debounced search input (`q` param), clear button, search-active border |
| i18n | `catalogToolbar.searchPlaceholder`, `clearSearch`; `home.emptySearch` |
| `apps/store/lib/pricing.ts` | Shared `branchProductFromPrice`, `unifiedProductFromPrice`, `unifiedProductInStock` |
| Shop pages | Locale-aware `formatMoney` for featured hero; search-aware empty state |
| Product grids | Reuse pricing helpers (removed duplicate inline logic) |
| Checkout form | `autoComplete` on all fields, `role="alert"` + `aria-live` on errors |
| `formatMoney` | Removed leftover debug fetch instrumentation |

### Verification

| Check | Result |
|-------|--------|
| API e2e | 37 suites, 161 tests pass (+1 search test) |
| Catalog e2e | 17 tests pass |

### Next candidates

- Playwright smoke for `/shop?q=` URL persistence
- Catalog search loading indicator during debounce navigation
- Checkout reduced-motion pass on radio cards
- Open PR for store catalog + account branch
