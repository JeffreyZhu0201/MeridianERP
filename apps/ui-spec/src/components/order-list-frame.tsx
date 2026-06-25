"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import { FulfillmentTypeBadge, type FulfillmentType } from "./fulfillment-type-badge";

export type OrderListTab = "all" | "pickup" | "delivery";

export interface OrderListRow {
  id: string;
  customerLabel: string;
  status: string;
  fulfillmentType: FulfillmentType;
  total: string;
  createdAt: string;
  meta?: string;
}

export interface OrderListFrameProps {
  title?: string;
  description?: string;
  /** Slot above filters — e.g. BentoListHeader KPI strip */
  headerSlot?: React.ReactNode;
  activeTab?: OrderListTab;
  onTabChange?: (tab: OrderListTab) => void;
  showTabs?: boolean;
  statusFilter?: string;
  onStatusFilterChange?: (value: string) => void;
  searchPlaceholder?: string;
  /** Extra filter controls (branch select on admin delivery queue) */
  filterSlot?: React.ReactNode;
  rows: OrderListRow[];
  /** Per-row actions — Verify pickup, Ship, View */
  renderRowAction?: (row: OrderListRow) => React.ReactNode;
  /** Merchant column (admin delivery queue) */
  showMerchantColumn?: boolean;
  merchantLabel?: (row: OrderListRow) => string;
  emptyState?: React.ReactNode;
  isLoading?: boolean;
  className?: string;
}

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  PAID: "default",
  FULFILLED: "default",
  PENDING_PAYMENT: "secondary",
  CANCELLED: "destructive",
};

function statusBadge(status: string) {
  return (
    <Badge variant={statusVariant[status] ?? "secondary"}>
      {status.replace("_", " ")}
    </Badge>
  );
}

/**
 * Shared order list chrome for admin + merchant portals.
 * Mirrors FW-LIST + Data Table showcase; propagates to @meridian/ui OrderListFrame.
 */
export function OrderListFrame({
  title,
  description,
  headerSlot,
  activeTab = "all",
  onTabChange,
  showTabs = true,
  statusFilter = "all",
  onStatusFilterChange,
  searchPlaceholder = "Search orders…",
  filterSlot,
  rows,
  renderRowAction,
  showMerchantColumn = false,
  merchantLabel,
  emptyState,
  isLoading,
  className,
}: OrderListFrameProps) {
  const filteredRows = React.useMemo(() => {
    if (activeTab === "pickup") {
      return rows.filter((r) => r.fulfillmentType === "PICKUP");
    }
    if (activeTab === "delivery") {
      return rows.filter((r) => r.fulfillmentType === "DELIVERY");
    }
    return rows;
  }, [activeTab, rows]);

  return (
    <div className={cn("space-y-4", className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title ? (
            <h3 className="text-2xl font-semibold tracking-tight">{title}</h3>
          ) : null}
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      )}

      {headerSlot}

      {showTabs ? (
        <Tabs
          value={activeTab}
          onValueChange={(v) => onTabChange?.(v as OrderListTab)}
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pickup">Pickup</TabsTrigger>
            <TabsTrigger value="delivery">Delivery</TabsTrigger>
          </TabsList>
        </Tabs>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Input placeholder={searchPlaceholder} className="max-w-xs" />
        <Select
          value={statusFilter}
          onValueChange={(v) => onStatusFilterChange?.(v ?? "all")}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="FULFILLED">Fulfilled</SelectItem>
            <SelectItem value="PENDING_PAYMENT">Pending</SelectItem>
          </SelectContent>
        </Select>
        {filterSlot}
      </div>

      {isLoading ? (
        <div className="rounded-xl ring-1 ring-border p-4 text-sm text-muted-foreground">
          Loading orders…
        </div>
      ) : filteredRows.length === 0 ? (
        (emptyState ?? (
          <div className="rounded-xl border border-dashed border-border/40 bg-muted/30 px-6 py-12 text-center">
            <p className="text-sm font-medium">No orders</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Orders matching your filters will appear here.
            </p>
          </div>
        ))
      ) : (
        <div className="rounded-xl ring-1 ring-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                {showMerchantColumn ? <TableHead>Branch</TableHead> : null}
                <TableHead>Customer</TableHead>
                <TableHead>Fulfillment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Date</TableHead>
                {renderRowAction ? (
                  <TableHead className="w-[100px]">Action</TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-xs">
                    {row.id.slice(0, 8)}…
                  </TableCell>
                  {showMerchantColumn ? (
                    <TableCell className="text-sm">
                      {merchantLabel?.(row) ?? "—"}
                    </TableCell>
                  ) : null}
                  <TableCell className="text-sm">{row.customerLabel}</TableCell>
                  <TableCell>
                    <FulfillmentTypeBadge type={row.fulfillmentType} />
                  </TableCell>
                  <TableCell>{statusBadge(row.status)}</TableCell>
                  <TableCell className="text-right tabular-nums text-sm font-medium">
                    {row.total}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {row.createdAt}
                  </TableCell>
                  {renderRowAction ? (
                    <TableCell>{renderRowAction(row)}</TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {!isLoading && filteredRows.length > 0 ? (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive>
                1
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </div>
  );
}
