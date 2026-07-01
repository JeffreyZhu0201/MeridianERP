'use client';

/**
 * CartDrawer - 购物车抽屉组件
 *
 * 用于商店前端快速查看购物车：
 * - 侧边抽屉式展示
 * - 显示购物车商品列表（名称、规格、数量、小计）
 * - 显示 subtotal 合计金额
 * - 提供结算和查看完整购物车按钮
 * - 支持删除商品
 *
 * @example
 * ```tsx
 * <CartDrawer
 *   open={isCartOpen}
 *   onOpenChange={setIsCartOpen}
 *   items={cartItems}
 *   subtotal={128.00}
 *   cartHref="/s/starbucks/cart"
 *   checkoutHref="/s/starbucks/checkout"
 *   onRemoveItem={(id) => removeFromCart(id)}
 * />
 * ```
 */

import Link from 'next/link';
import { Button } from './ui/button';
import { Sheet, SheetFooter } from './ui/sheet';

/**
 * 购物车商品项
 * @param id - 商品唯一 ID
 * @param productName - 商品名称
 * @param variantName - 规格名称（如"中杯"、"加糖"）
 * @param quantity - 数量
 * @param lineTotal - 该项小计金额
 */
export interface CartDrawerItem {
  id: string;
  productName: string;
  variantName: string;
  quantity: number;
  lineTotal: string | number;
}

/**
 * CartDrawer 属性接口
 * @param open - 抽屉是否打开
 * @param onOpenChange - 抽屉开关状态变化回调
 * @param items - 购物车商品数组
 * @param subtotal - 购物车合计金额
 * @param cartHref - 查看完整购物车链接
 * @param checkoutHref - 去结算链接
 * @param onRemoveItem - 删除商品回调
 */
export interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartDrawerItem[];
  subtotal: string | number;
  cartHref: string;
  checkoutHref: string;
  onRemoveItem?: (id: string) => void;
}

/** 格式化价格显示（USD 格式） */
function formatPrice(price: string | number): string {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
}

/**
 * 购物车抽屉组件
 * - 使用 Sheet 组件实现侧边抽屉
 * - 底部显示 subtotal 和操作按钮
 * - 商品列表展示商品信息
 * - 空购物车时显示提示文案
 */
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
            {/* 合计金额 */}
            <div className="flex items-center justify-between text-sm font-medium">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {/* 结算按钮 */}
            <Link href={checkoutHref} onClick={() => onOpenChange(false)}>
              <Button className="w-full">Checkout</Button>
            </Link>
            {/* 查看完整购物车按钮 */}
            <Link href={cartHref} onClick={() => onOpenChange(false)}>
              <Button variant="outline" className="w-full">
                View full cart
              </Button>
            </Link>
          </SheetFooter>
        ) : undefined
      }
    >
      {/* 商品列表或空状态 */}
      {items.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">Your cart is empty.</p>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3 border-b border-border/50 pb-4">
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
