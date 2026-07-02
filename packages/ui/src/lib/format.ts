/**
 * Shared formatting utilities for consistent display across all portals.
 */

const LOCALE_ALIASES: Record<string, string> = {
  en: 'en-US',
  zh: 'zh-CN',
};

function resolveLocale(locale: string): string {
  return LOCALE_ALIASES[locale] ?? locale;
}

/** next-intl locale tags (en, zh) and BCP-47 tags (en-US), not ISO 4217 currency codes. */
function isLocaleTag(tag: string): boolean {
  return tag in LOCALE_ALIASES || /^[a-z]{2}(-[A-Z]{2})?$/.test(tag);
}

export function formatMoney(
  value: string | number,
  currencyOrLocale: string = 'USD',
  maybeLocale?: string,
): string {
  let currency: string;
  let locale: string;

  if (maybeLocale !== undefined) {
    if (isLocaleTag(currencyOrLocale)) {
      // formatMoney(value, locale, currency) — reversed arg order at some call sites
      locale = resolveLocale(currencyOrLocale);
      currency = maybeLocale;
    } else {
      // formatMoney(value, currency, locale)
      currency = currencyOrLocale;
      locale = resolveLocale(maybeLocale);
    }
  } else if (isLocaleTag(currencyOrLocale)) {
    // formatMoney(value, locale) — locale passed where currency used to be expected
    currency = 'USD';
    locale = resolveLocale(currencyOrLocale);
  } else {
    // formatMoney(value) or formatMoney(value, currency)
    currency = currencyOrLocale;
    locale = 'en-US';
  }

  // #region agent log
  fetch('http://127.0.0.1:7530/ingest/82205c42-ce7f-4037-aefd-fa21e4c56b46', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '59bc7f' },
    body: JSON.stringify({
      sessionId: '59bc7f',
      runId: 'post-fix',
      hypothesisId: 'H1',
      location: 'packages/ui/src/lib/format.ts:formatMoney',
      message: 'formatMoney resolved args',
      data: { currency, locale, rawSecond: currencyOrLocale, rawThird: maybeLocale ?? null },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(Number(value));
}

export function formatDate(iso: string, locale = 'en-US'): string {
  return new Intl.DateTimeFormat(resolveLocale(locale), {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso));
}

export function formatDateTime(iso: string, locale = 'en-US'): string {
  return new Intl.DateTimeFormat(resolveLocale(locale), {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}
