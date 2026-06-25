'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { cn } from '../../lib/utils';
import { BentoTile } from './bento-tile';
import { EmptyState } from '../empty-state';

export interface BentoChartSeries {
  key: string;
  label: string;
  color?: string;
}

export interface BentoChartTileProps {
  title: string;
  description?: string;
  colSpan?: 2 | 3 | 4;
  rowSpan?: 1 | 2;
  data: ReadonlyArray<{ [key: string]: string | number }>;
  series: BentoChartSeries[];
  xKey?: string;
  emptyMessage?: string;
  className?: string;
}

function hasChartData(
  data: ReadonlyArray<{ [key: string]: string | number }>,
  series: BentoChartSeries[],
) {
  return data.some((row) =>
    series.some((s) => {
      const v = row[s.key];
      return typeof v === 'number' ? v > 0 : Number(v) > 0;
    }),
  );
}

export function BentoChartTile({
  title,
  description,
  colSpan = 2,
  rowSpan = 2,
  data,
  series,
  xKey = 'date',
  emptyMessage = 'No activity in this period',
  className,
}: BentoChartTileProps) {
  const primary = series[0];
  const showChart = primary && hasChartData(data, series);

  return (
    <BentoTile colSpan={colSpan} rowSpan={rowSpan} className={className}>
      <div className="flex h-full min-h-[220px] flex-col p-4 md:p-6">
        <div className="mb-4">
          <h3 className="text-sm font-medium">{title}</h3>
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <div className="min-h-0 flex-1">
          {showChart && primary ? (
            <ResponsiveContainer width="100%" height="100%" minHeight={160}>
              <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
                <XAxis
                  dataKey={xKey}
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: string) => v.slice(5)}
                />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={32} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid hsl(var(--border) / 0.5)',
                    background: 'hsl(var(--popover))',
                    fontSize: '12px',
                  }}
                />
                {series.map((s) => (
                  <Bar
                    key={s.key}
                    dataKey={s.key}
                    name={s.label}
                    fill={s.color ?? 'hsl(var(--primary))'}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title={emptyMessage} className={cn('py-8')} />
          )}
        </div>
      </div>
    </BentoTile>
  );
}
