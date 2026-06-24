import { type ReactNode } from 'react';
import { cn } from '../lib/utils';
import { Card, CardContent } from './ui/card';

export interface MetricCardProps {
  title: string;
  value: string | number;
  className?: string;
  icon?: ReactNode;
}

export function MetricCard({ title, value, className, icon }: MetricCardProps) {
  return (
    <Card className={cn(className)}>
      <CardContent className="p-4 pt-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{title}</p>
          {icon ? <span className="text-muted-foreground">{icon}</span> : null}
        </div>
        <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}
