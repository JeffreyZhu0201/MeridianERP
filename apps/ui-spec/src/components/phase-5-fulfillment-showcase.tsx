"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DeliveryShipDialog } from "@/components/delivery-ship-dialog";
import { FulfillmentTypeBadge } from "@/components/fulfillment-type-badge";
import { OrderListFrame } from "@/components/order-list-frame";
import { PickupVerifyDialog } from "@/components/pickup-verify-dialog";

const DEMO_ORDERS = [
  {
    id: "ord_cm3pickup01",
    customerLabel: "guest@example.com",
    status: "PAID",
    fulfillmentType: "PICKUP" as const,
    total: "¥128.00",
    createdAt: "Jun 24, 2025 14:32",
    meta: "West Branch",
  },
  {
    id: "ord_cm3deliv002",
    customerLabel: "li.wei@example.com",
    status: "PAID",
    fulfillmentType: "DELIVERY" as const,
    total: "¥456.50",
    createdAt: "Jun 24, 2025 11:05",
    meta: "East Branch",
  },
  {
    id: "ord_cm3fulfill3",
    customerLabel: "guest@example.com",
    status: "FULFILLED",
    fulfillmentType: "PICKUP" as const,
    total: "¥89.00",
    createdAt: "Jun 23, 2025 09:18",
    meta: "West Branch",
  },
];

export function Phase5FulfillmentShowcase() {
  const [verifyOpen, setVerifyOpen] = React.useState(false);
  const [shipOpen, setShipOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"all" | "pickup" | "delivery">("pickup");

  return (
    <div className="flex flex-col gap-8">
      <Card id="fulfillment-type-badge">
        <CardHeader>
          <CardTitle>FulfillmentTypeBadge</CardTitle>
          <CardDescription>
            PICKUP (branch) vs DELIVERY (HQ ship). Used in order tables and detail headers.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <FulfillmentTypeBadge type="PICKUP" />
          <FulfillmentTypeBadge type="DELIVERY" />
        </CardContent>
      </Card>

      <Card id="order-list-frame" className="overflow-hidden">
        <CardHeader>
          <CardTitle>OrderListFrame</CardTitle>
          <CardDescription>
            Shared list chrome — FW-LIST + Tabs + Data Table + Pagination. Admin delivery queue
            sets showMerchantColumn; merchant pickup tab defaults activeTab=&quot;pickup&quot;.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrderListFrame
            activeTab={activeTab}
            onTabChange={setActiveTab}
            showMerchantColumn
            merchantLabel={(row) => row.meta ?? "—"}
            rows={DEMO_ORDERS}
            renderRowAction={(row) =>
              row.status === "PAID" && row.fulfillmentType === "PICKUP" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setVerifyOpen(true)}
                >
                  Verify
                </Button>
              ) : row.status === "PAID" && row.fulfillmentType === "DELIVERY" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShipOpen(true)}
                >
                  Ship
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )
            }
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card id="pickup-verify-dialog">
          <CardHeader>
            <CardTitle>PickupVerifyDialog</CardTitle>
            <CardDescription>
              Merchant branch staff — Input OTP + optional Scan QR. 44px touch on scan button.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setVerifyOpen(true)}>Open verify dialog</Button>
            <PickupVerifyDialog
              open={verifyOpen}
              onOpenChange={setVerifyOpen}
              orderId="ord_cm3pickup01"
              customerLabel="guest@example.com"
              total="¥128.00"
              onVerify={() => setVerifyOpen(false)}
            />
          </CardContent>
        </Card>

        <Card id="delivery-ship-dialog">
          <CardHeader>
            <CardTitle>DeliveryShipDialog</CardTitle>
            <CardDescription>
              Admin HQ ship — AlertDialog with line items and stock warning slot.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => setShipOpen(true)}>
              Open ship dialog
            </Button>
            <DeliveryShipDialog
              open={shipOpen}
              onOpenChange={setShipOpen}
              orderId="ord_cm3deliv002"
              branchName="East Branch"
              customerLabel="li.wei@example.com"
              addressSummary="Li Wei · 138****5678 · 上海市浦东新区世纪大道 100 号"
              lines={[
                { productName: "Organic Green Tea", skuCode: "MST-TEA-01", quantity: 2 },
                { productName: "Ceramic Mug Set", skuCode: "MST-MUG-02", quantity: 1 },
              ]}
              onConfirm={() => setShipOpen(false)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
