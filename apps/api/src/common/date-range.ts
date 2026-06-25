import { BadRequestException } from '@nestjs/common';
import {
  DEFAULT_COMMISSION_WINDOW_DAYS,
  type DateRangeQuery,
} from '@meridian/shared';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0),
  );
}

function endOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  );
}

function parseDateInput(value: string, boundary: 'start' | 'end'): Date {
  if (DATE_ONLY.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return boundary === 'start' ? startOfUtcDay(date) : endOfUtcDay(date);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException(`Invalid date: ${value}`);
  }
  return parsed;
}

/** UTC start of day for the default commission/dashboard lookback window. */
export function dashboardWindowStart(
  days = DEFAULT_COMMISSION_WINDOW_DAYS,
): Date {
  return startOfUtcDay(
    new Date(Date.now() - days * 24 * 60 * 60 * 1000),
  );
}

export function parseDateRangeQuery(
  query: DateRangeQuery,
  defaultDays = DEFAULT_COMMISSION_WINDOW_DAYS,
): { from: Date; to: Date; fromIso: string; toIso: string } {
  const todayEnd = endOfUtcDay(new Date());

  const to = query.to ? parseDateInput(query.to, 'end') : todayEnd;
  const from = query.from
    ? parseDateInput(query.from, 'start')
    : startOfUtcDay(
        new Date(to.getTime() - defaultDays * 24 * 60 * 60 * 1000),
      );

  if (from > to) {
    throw new BadRequestException('from must be before or equal to to');
  }

  return {
    from,
    to,
    fromIso: from.toISOString(),
    toIso: to.toISOString(),
  };
}

/** YYYY-MM-DD for each calendar day in [from, to] inclusive (UTC). */
export function eachUtcDay(from: Date, to: Date): string[] {
  const days: string[] = [];
  let cursor = startOfUtcDay(from);
  const end = startOfUtcDay(to);
  while (cursor <= end) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
  }
  return days;
}
