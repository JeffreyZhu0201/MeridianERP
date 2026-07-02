'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';

/**
 * Combobox - 下拉搜索组合框
 * 基于 Popover + Command 实现
 */
export interface ComboboxProps {
  value?: string;
  onValueChange?: (value: string) => void;
  options?: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}

export const Combobox = ({
  value,
  onValueChange,
  options = [],
  placeholder = 'Select...',
  className,
}: ComboboxProps) => {
  const [open, setOpen] = React.useState(false);

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        {value ? options.find(o => o.value === value)?.label : placeholder}
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-md">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onValueChange?.(option.value);
                setOpen(false);
              }}
              className={cn(
                'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none',
                value === option.value && 'bg-accent text-accent-foreground'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
