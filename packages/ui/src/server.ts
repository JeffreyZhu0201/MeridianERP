/** Server-safe @meridian/ui exports (no Sidebar, shells, theme providers, or chart widgets). */

export {
  ListPageFrame,
  type ListPageFrameProps,
  DetailPageFrame,
  type DetailPageFrameProps,
  FormPageFrame,
  type FormPageFrameProps,
  SettingsPageFrame,
  type SettingsPageFrameProps,
  BindPageFrame,
  type BindPageFrameProps,
  DashboardPageFrame,
  type DashboardPageFrameProps,
  AuthStatusFrame,
  type AuthStatusFrameProps,
  ErpListPage,
  type ErpListPageProps,
} from './components/frameworks';

export {
  BentoGrid,
  BentoTile,
  BentoMetricTile,
  BentoListHeader,
  BentoDetailHero,
  BentoDashboardFrame,
  type BentoGridProps,
  type BentoTileProps,
  type BentoMetricTileProps,
  type BentoListHeaderProps,
  type BentoDetailHeroProps,
  type BentoDashboardFrameProps,
} from './components/bento';

export { AuthLayout, type AuthLayoutProps } from './components/auth-layout';
export { ProductCard, type ProductCardProps } from './components/product-card';
export {
  StoreCatalogHeader,
  type StoreCatalogHeaderProps,
  type StoreCatalogMetric,
} from './components/store/store-catalog-header';
export { StoreFeaturedHero, type StoreFeaturedHeroProps } from './components/store/store-featured-hero';
export {
  StoreAccountSidebar,
  type StoreAccountSidebarProps,
  type StoreAccountSection,
} from './components/store/store-account-sidebar';
export {
  StoreAccountProfileHero,
  type StoreAccountProfileHeroProps,
} from './components/store/store-account-profile-hero';
export {
  StoreAccountOrderList,
  type StoreAccountOrderListProps,
  type StoreAccountOrderRow,
} from './components/store/store-account-order-list';
export { MetricCard, type MetricCardProps } from './components/metric-card';
export { PageHeader, type PageHeaderProps } from './components/page-header';
export { EmptyState, type EmptyStateProps } from './components/empty-state';
export { PurchaseOrderStatusBadge } from './components/inventory/purchase-order-status-badge';
export { StockAdjustmentReasonBadge } from './components/inventory/stock-adjustment-reason-badge';
export { FulfillmentTypeBadge } from './components/orders/fulfillment-type-badge';
export {
  OnboardingStatusBadge,
  StatusBadge,
  type OnboardingStatusBadgeProps,
} from './components/status/onboarding-status-badge';
export { OrderStatusBadge, type OrderStatusBadgeProps } from './components/status/order-status-badge';

export { Button, buttonVariants, type ButtonProps } from './components/ui/button';
export { Input } from './components/ui/input';
export { Label } from './components/ui/label';
export { Textarea } from './components/ui/textarea';
export { Card, CardHeader, CardTitle, CardContent } from './components/ui/card';
export { Badge, type BadgeProps, type BadgeVariant } from './components/ui/badge';
export {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from './components/ui/table';
export { Dialog, Skeleton as DialogSkeleton } from './components/ui/dialog';
export { DialogCloseButton } from './components/ui/dialog-close-button';
export { Sheet, SheetFooter } from './components/ui/sheet';
export { Select } from './components/ui/select';
export { Skeleton } from './components/ui/skeleton';
export { Separator } from './components/ui/separator';
export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './components/ui/breadcrumb';

export { cn } from './lib/utils';
export { formatMoney } from './lib/format';
