'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import { Sheet, SheetFooter } from './ui/sheet';

export interface CartDrawerItem {
  id: string;
  productName: string;
  variantName: string;
  quantity: number;
  lineTotal: string | number;
}

export interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartDrawerItem[];
  subtotal: string | number;
  cartHref: string;
  checkoutHref: string;
  onRemoveItem?: (id: string) => void;
}

function formatPrice(price: string | number): string {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
}

export function CartDrawer({
  open,
  onOpenChange,
  items,
  subtotal,
  cartHref,
  checkoutHref,
  onRemoveItem,
}: CartDrawerProps) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Your cart"
      footer={
        items.length > 0 ? (
          <SheetFooter className="flex-col items-stretch gap-3 sm:flex-col">
            <div className="flex items-center justify-between text-sm font-medium">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <Link href={checkoutHref} onClick={() => onOpenChange(false)}>
              <Button className="w-full">Checkout</Button>
            </Link>
            <Link href={cartHref} onClick={() => onOpenChange(false)}>
              <Button variant="outline" className="w-full">
                View full cart
              </Button>
            </Link>
          </SheetFooter>
        ) : undefined
      }
    >
      {items.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">Your cart is empty.</p>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3 border-b pb-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{item.productName}</p>
                <p className="text-xs text-muted-foreground">{item.variantName}</p>
                <p className="mt-1 text-xs text-muted-foreground">Qty {item.quantity}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-sm font-medium">{formatPrice(item.lineTotal)}</span>
                {onRemoveItem ? (
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.id)}
                    className="text-xs text-destructive hover:underline"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
