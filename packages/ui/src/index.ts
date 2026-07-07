/**
 * @meridian/ui - MeridanERP 共享 UI 组件库
 */

// ============================================================
// Shell 组件 - 页面布局骨架
// ============================================================

/** 认证页面布局 - 居中卡片样式（登录/注册页） */
export { AuthLayout, type AuthLayoutProps } from './components/auth-layout';

/** 平台管理员 Shell - 侧边栏导航 + 顶部工具栏 */
export { AdminShell, type AdminShellProps } from './components/shells/admin-shell';

/**
 * @deprecated 请使用 ErpShell 替代
 * 旧版 Shell 框架组件，已废弃
 */
export { ShellFrame, type ShellFrameProps } from './components/shells/shell-frame';

/** 商户分店 Shell - 侧边栏导航 + 低库存警告徽章 */
export { MerchantShell, type MerchantShellProps } from './components/shells/merchant-shell';
export { ShellUserChip, type ShellUserChipProps } from './components/shells/shell-user-chip';

/** 商店前端 Shell - 商店选购页面布局（购物车、账户导航） */
export { StoreShell, type StoreShellProps } from './components/shells/store-shell';

/** 商店结账 Shell - 极简头部，无主导航 */
export {
  StoreCheckoutShell,
  type StoreCheckoutShellProps,
} from './components/shells/store-checkout-shell';

/** Store catalog & account UI (stich.md) */
export {
  StoreCatalogHeader,
  type StoreCatalogHeaderProps,
  type StoreCatalogMetric,
} from './components/store/store-catalog-header';
export { StoreFeaturedHero, type StoreFeaturedHeroProps } from './components/store/store-featured-hero';
export {
  StoreCatalogExplorer,
  StoreCatalogToolbar,
  type StoreCatalogExplorerProps,
  type StoreCatalogNavSource,
  type StoreCatalogToolbarProps,
} from './components/store/store-catalog-toolbar';
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
export {
  StoreAddressList,
  type StoreAddressListProps,
} from './components/store/store-address-list';
export {
  StoreAddressForm,
  type StoreAddressFormProps,
  type StoreAddressFormLabels,
} from './components/store/store-address-form';
export {
  StoreAccountSettingsForm,
  type StoreAccountSettingsFormProps,
  type StoreAccountSettingsFormLabels,
} from './components/store/store-account-settings-form';

/** 渠道经销商 Shell - 简洁顶部导航 */
export { DistributorShell, type DistributorShellProps } from './components/shells/distributor-shell';

/** 通用 ERP Shell - 基于 Sidebar 的现代布局框架（推荐使用） */
export { ErpShell, type ErpShellProps } from './components/frameworks/erp-shell';

// ============================================================
// 页面框架组件 - 标准数据页面布局
// ============================================================

export {
  ListPageFrame,           /** 列表页框架：标题 + 筛选器 + 表格 */
  type ListPageFrameProps,
  DetailPageFrame,         /** 详情页框架：面包屑 + 标题 + 操作按钮 */
  type DetailPageFrameProps,
  FormPageFrame,           /** 表单页框架：标题 + Card 包裹的表单 + 底部操作 */
  type FormPageFrameProps,
  SettingsPageFrame,       /** 设置页框架：堆叠式设置卡片 */
  type SettingsPageFrameProps,
  BindPageFrame,           /** 绑定页框架：居中状态卡片 */
  type BindPageFrameProps,
  DashboardPageFrame,      /** 仪表盘页框架：标题 + 指标网格 */
  type DashboardPageFrameProps,
  AuthStatusFrame,         /** 认证状态页框架：登录/入驻引导 */
  type AuthStatusFrameProps,
  ErpListPage,             /** ERP 列表页：指标条 + ListPageFrame */
  type ErpListPageProps,
} from './components/frameworks';

// ============================================================
// 主题与国际化组件
// ============================================================

/**
 * 主题组件导出
 * - ThemeProvider: 暗色模式支持（基于 next-themes）
 * - ModeToggle: 明/暗/系统主题切换按钮
 * - LocaleToggle: 中英文切换下拉菜单
 * - PortalThemeProvider: 各门户专用主题 Provider
 * - PortalLocaleProvider: 各门户专用国际化 Provider
 * - AuthToolbar: 认证页工具栏（主题 + 语言切换）
 */
export { ThemeProvider, ModeToggle, LocaleToggle, PortalThemeProvider, PortalLocaleProvider, AuthToolbar } from './components/theme';

// ============================================================
// 业务组件
// ============================================================

/** 商品卡片 - 商店前端产品展示 */
export { ProductCard, type ProductCardProps } from './components/product-card';

/** 购物车抽屉 - 商店前端快速查看购物车 */
export { CartDrawer, type CartDrawerItem, type CartDrawerProps } from './components/cart-drawer';

/** 指标卡片 - 单值指标展示（用于仪表盘统计） */
export { MetricCard, type MetricCardProps } from './components/metric-card';

/** 页面标题 - 数据密集型后台统一页头 */
export { PageHeader, type PageHeaderProps } from './components/page-header';

/** 空状态 - 列表无数据时的占位提示 */
export { EmptyState, type EmptyStateProps } from './components/empty-state';

/** 采购单状态徽章 - DRAFT/ORDERED/PARTIALLY_RECEIVED/RECEIVED/CANCELLED */
export { PurchaseOrderStatusBadge } from './components/inventory/purchase-order-status-badge';

/** 库存调整原因徽章 - DAMAGE/COUNT_CORRECTION/RETURN/OTHER */
export { StockAdjustmentReasonBadge } from './components/inventory/stock-adjustment-reason-badge';

// ============================================================
// Bento 仪表盘组件 - 网格化指标展示
// ============================================================

export {
  BentoGrid,               /** Bento 网格容器 - 自适应列数布局 */
  BentoTile,               /** Bento 瓦片 - 可指定列跨度/行跨度 */
  BentoMetricTile,         /** Bento 指标瓦片 - 标题 + 数值 + 描述 */
  BentoListHeader,         /** Bento 列表头部指标条 */
  BentoDetailHero,         /** Bento 详情页顶部指标组 */
  BentoChartTile,          /** Bento 图表瓦片 - 柱状图展示 */
  BentoDashboardFrame,     /** Bento 仪表盘框架 */
  type BentoGridProps,
  type BentoTileProps,
  type BentoMetricTileProps,
  type BentoListHeaderProps,
  type BentoDetailHeroProps,
  type BentoChartTileProps,
  type BentoChartSeries,
  type BentoDashboardFrameProps,
} from './components/bento';

// ============================================================
// 订单相关组件
// ============================================================

export {
  OrderListFrame,          /** 订单列表框架 - 支持自提/配送筛选 */
  FulfillmentTypeBadge,     /** 履约类型徽章 - PICKUP/DELIVERY */
  PickupVerifyDialog,       /** 自提核销对话框 - 6 位码/二维码 */
  DeliveryShipDialog,       /** 配送发货确认对话框 */
  type OrderListFrameProps,
  type OrderListRow,
  type OrderListTab,
  type FulfillmentType,
  type PickupVerifyDialogProps,
  type DeliveryShipDialogProps,
  type DeliveryShipLine,
} from './components/orders';

// ============================================================
// UI 原语组件（基于 shadcn/ui）
// ============================================================

/** 按钮组件 */
export { Button, buttonVariants, type ButtonProps } from './components/ui/button';

/** 文本输入框 */
export { Input } from './components/ui/input';

/** 表单标签 */
export { Label } from './components/ui/label';

/** 多行文本输入 */
export { Textarea } from './components/ui/textarea';

/** 卡片组件 */
export { Card, CardHeader, CardTitle, CardDescription, CardContent } from './components/ui/card';

/** 徽章/标签组件 */
export { Badge, type BadgeProps, type BadgeVariant } from './components/ui/badge';

/** 表格组件 */
export {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from './components/ui/table';

/** 对话框组件 */
export { Dialog, Skeleton as DialogSkeleton } from './components/ui/dialog';

/** 对话框关闭按钮 */
export { DialogCloseButton } from './components/ui/dialog-close-button';

/** 侧边抽屉 */
export { Sheet, SheetFooter } from './components/ui/sheet';

/** 下拉选择框 */
export { Select } from './components/ui/select';

/** 骨架屏加载占位 */
export { Skeleton } from './components/ui/skeleton';

/** 分隔线 */
export { Separator } from './components/ui/separator';

/** 面包屑导航 */
export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './components/ui/breadcrumb';

/** 侧边栏组件 */
export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
} from './components/ui/sidebar';

/** 标签页组件 */
export { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/tabs';

/** OTP 一次性密码输入 */
export {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from './components/ui/input-otp';

// ============================================================
// 新增 UI 原语组件（shadcn/ui 完整集合）
// ============================================================

/** 手风琴展开组件 */
export { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './components/ui/accordion';

/** 警告提示组件 */
export { Alert, AlertTitle, AlertDescription } from './components/ui/alert';

/** 警告对话框 */
export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from './components/ui/alert-dialog';

/** 头像组件 */
export { Avatar, AvatarImage, AvatarFallback } from './components/ui/avatar';

/** 日历组件 */
export {
  Calendar,
  CalendarHeader,
  CalendarHeading,
  CalendarNav,
  CalendarPrevButton,
  CalendarNextButton,
  CalendarGrid,
  CalendarHead,
  CalendarRow,
  CalendarHeadCell,
  CalendarBody,
  CalendarCell,
} from './components/ui/calendar';

/** 图表组件（recharts 封装） */
export { Chart, ChartContainer } from './components/ui/chart';

/** 复选框组件 */
export { Checkbox } from './components/ui/checkbox';

/** 可折叠组件 */
export { Collapsible, CollapsibleTrigger, CollapsibleContent } from './components/ui/collapsible';

/** 组合框/下拉搜索 */
export { Combobox, type ComboboxProps } from './components/ui/combobox';

/** 命令面板/搜索框 */
export {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from './components/ui/command';

/** 右键菜单 */
export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
} from './components/ui/context-menu';

/** 悬浮卡片 */
export { HoverCard, HoverCardTrigger, HoverCardContent } from './components/ui/hover-card';

/** 输入框组 */
export { InputGroup, InputGroupAddon } from './components/ui/input-group';

/** 菜单栏 */
export { Menubar, MenubarTrigger, MenubarContent, MenubarItem, MenubarSeparator } from './components/ui/menubar';

/** 分页组件 */
export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './components/ui/pagination';

/** 弹出框 */
export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor } from './components/ui/popover';

/** 进度条 */
export { Progress } from './components/ui/progress';

/** 单选组 */
export { RadioGroup, RadioGroupItem } from './components/ui/radio-group';

/** 可调整尺寸面板 */
export { ResizablePanel, ResizablePanelGroup, ResizableHandle } from './components/ui/resizable';

/** 滚动区域 */
export { ScrollArea, ScrollBar } from './components/ui/scroll-area';

/** 滑块 */
export { Slider } from './components/ui/slider';

/** 烤面包/通知组件 */
export { Toaster, toast } from './components/ui/sonner';

/** 开关组件 */
export { Switch } from './components/ui/switch';

/** 切换按钮 */
export { Toggle, toggleVariants } from './components/ui/toggle';

/** 切换按钮组 */
export { ToggleGroup, ToggleGroupItem, toggleGroupVariants } from './components/ui/toggle-group';

// ============================================================
// 工具函数与样式常量
// ============================================================

/** 类名合并工具（Tailwind CSS） */
export { cn } from './lib/utils';

/** 表面样式常量 */
export { surfaceRing, surfaceRingLg, shellDividerB, shellDividerT } from './lib/surfaces';

/** 格式化工具函数 */
export { formatMoney, formatDate, formatDateTime } from './lib/format';

/** URL 分页控件 */
export { ListPagination, type ListPaginationProps } from './components/list-pagination';

/** 状态徽章 */
export {
  OnboardingStatusBadge,
  StatusBadge,
  type OnboardingStatusBadgeProps,
} from './components/status/onboarding-status-badge';
export { OrderStatusBadge, type OrderStatusBadgeProps } from './components/status/order-status-badge';

/** 下拉菜单 */
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from './components/ui/dropdown-menu';

/** 工具提示 */
export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from './components/ui/tooltip';
