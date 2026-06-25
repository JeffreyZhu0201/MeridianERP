"use client";

/* eslint-disable @typescript-eslint/no-unused-vars */

import * as React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { 
  BellRing, 
  Check, 
  ChevronRight, 
  Circle, 
  CreditCard, 
  Keyboard, 
  Mail, 
  MessageSquare, 
  Plus, 
  Settings, 
  User, 
  UserPlus, 
  Users,
  Bold,
  Italic,
  Underline
} from "lucide-react";

import { ModeToggle } from "@/components/mode-toggle";
import { Phase5FulfillmentShowcase } from "@/components/phase-5-fulfillment-showcase";

export default function ComponentShowcase() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  
  return (
    <div className="container mx-auto py-10 px-4 md:px-8 max-w-7xl">
      <div className="flex flex-col gap-2 mb-10">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">UI Components Specification</h1>
          <ModeToggle />
        </div>
        <p className="text-muted-foreground">
          A comprehensive showcase of all shadcn/ui components available in the MeridianERP project.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        
        {/* Buttons & Badges */}
        <div className="flex flex-col gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
              <CardDescription>Standard button variants.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
              <Button size="icon"><Plus className="h-4 w-4" /></Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Badges</CardTitle>
              <CardDescription>Status and label indicators.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Avatars</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>AB</AvatarFallback>
              </Avatar>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Tooltip & Hover Card</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-8 items-center">
              <Tooltip>
                <TooltipTrigger render={<Button variant="outline" size="icon" />}>
                  <Plus className="h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add to library</p>
                </TooltipContent>
              </Tooltip>

              <HoverCard>
                <HoverCardTrigger render={<Button variant="link" />}>@nextjs</HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <div className="flex justify-between space-x-4">
                    <Avatar>
                      <AvatarImage src="https://github.com/vercel.png" />
                      <AvatarFallback>VC</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold">@nextjs</h4>
                      <p className="text-sm">
                        The React Framework - created and maintained by @vercel.
                      </p>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
            </CardContent>
          </Card>
        </div>

        {/* Form Controls */}
        <div className="flex flex-col gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Form Controls</CardTitle>
              <CardDescription>Inputs, selects, and textareas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="m@example.com" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" placeholder="Tell us about yourself." />
              </div>

              <div className="space-y-2">
                <Label>Framework</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a framework" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="next">Next.js</SelectItem>
                    <SelectItem value="svelte">SvelteKit</SelectItem>
                    <SelectItem value="astro">Astro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="terms" />
                <Label htmlFor="terms">Accept terms and conditions</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="airplane-mode" />
                <Label htmlFor="airplane-mode">Airplane Mode</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Radio Group & Slider</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <RadioGroup defaultValue="comfortable">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="default" id="r1" />
                  <Label htmlFor="r1">Default</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="comfortable" id="r2" />
                  <Label htmlFor="r2">Comfortable</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="compact" id="r3" />
                  <Label htmlFor="r3">Compact</Label>
                </div>
              </RadioGroup>

              <div className="space-y-4">
                <Label>Volume</Label>
                <Slider defaultValue={[50]} max={100} step={1} />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Toggle & Toggle Group</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Toggle aria-label="Toggle italic">
                <Italic className="h-4 w-4" />
              </Toggle>
              
              <ToggleGroup type="multiple">
                <ToggleGroupItem value="bold" aria-label="Toggle bold">
                  <Bold className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="italic" aria-label="Toggle italic">
                  <Italic className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="underline" aria-label="Toggle underline">
                  <Underline className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </CardContent>
          </Card>
        </div>

        {/* Overlays & Dialogs */}
        <div className="flex flex-col gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Dialogs & Overlays</CardTitle>
              <CardDescription>Modals, sheets, and popovers.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Dialog>
                <DialogTrigger render={<Button variant="outline" />}>Open Dialog</DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Are you absolutely sure?</DialogTitle>
                    <DialogDescription>
                      This action cannot be undone. This will permanently delete your account
                      and remove your data from our servers.
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>

              <AlertDialog>
                <AlertDialogTrigger render={<Button variant="outline" />}>Alert Dialog</AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction>Continue</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Sheet>
                <SheetTrigger render={<Button variant="outline" />}>Open Sheet</SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Edit profile</SheetTitle>
                    <SheetDescription>
                      Make changes to your profile here. Click save when you&apos;re done.
                    </SheetDescription>
                  </SheetHeader>
                </SheetContent>
              </Sheet>

              <Popover>
                <PopoverTrigger render={<Button variant="outline" />}>Open Popover</PopoverTrigger>
                <PopoverContent>
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Dimensions</h4>
                    <p className="text-sm text-muted-foreground">
                      Set the dimensions for the layer.
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Menus</CardTitle>
              <CardDescription>Dropdowns and context menus.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="outline" />}>Open Dropdown</DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Billing</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <ContextMenu>
                <ContextMenuTrigger className="flex h-[150px] w-full items-center justify-center rounded-md border border-dashed text-sm">
                  Right click here
                </ContextMenuTrigger>
                <ContextMenuContent className="w-64">
                  <ContextMenuItem inset>
                    Back
                    <ContextMenuShortcut>⌘[</ContextMenuShortcut>
                  </ContextMenuItem>
                  <ContextMenuItem inset disabled>
                    Forward
                    <ContextMenuShortcut>⌘]</ContextMenuShortcut>
                  </ContextMenuItem>
                  <ContextMenuItem inset>
                    Reload
                    <ContextMenuShortcut>⌘R</ContextMenuShortcut>
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Toast Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={() =>
                  toast("Event has been created", {
                    description: "Sunday, December 03, 2023 at 9:00 AM",
                    action: {
                      label: "Undo",
                      onClick: () => console.log("Undo"),
                    },
                  })
                }
              >
                Show Toast
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Data Display */}
        <div className="flex flex-col gap-8 md:col-span-2 xl:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Data Table</CardTitle>
              <CardDescription>A simple table component.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableCaption>A list of your recent invoices.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Invoice</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">INV001</TableCell>
                    <TableCell>Paid</TableCell>
                    <TableCell>Credit Card</TableCell>
                    <TableCell className="text-right">$250.00</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">INV002</TableCell>
                    <TableCell>Pending</TableCell>
                    <TableCell>PayPal</TableCell>
                    <TableCell className="text-right">$150.00</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">INV003</TableCell>
                    <TableCell>Unpaid</TableCell>
                    <TableCell>Bank Transfer</TableCell>
                    <TableCell className="text-right">$350.00</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Navigation & Layout */}
        <div className="flex flex-col gap-8 md:col-span-2 xl:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Tabs & Accordion</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                <Tabs defaultValue="account" className="w-[400px]">
                  <TabsList>
                    <TabsTrigger value="account">Account</TabsTrigger>
                    <TabsTrigger value="password">Password</TabsTrigger>
                  </TabsList>
                  <TabsContent value="account">Make changes to your account here.</TabsContent>
                  <TabsContent value="password">Change your password here.</TabsContent>
                </Tabs>

                <Accordion type="single" className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>Is it accessible?</AccordionTrigger>
                    <AccordionContent>
                      Yes. It adheres to the WAI-ARIA design pattern.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                    <AccordionTrigger>Is it styled?</AccordionTrigger>
                    <AccordionContent>
                      Yes. It comes with default styles that matches the other components.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Feedback & Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                <Alert>
                  <AlertTitle>Heads up!</AlertTitle>
                  <AlertDescription>
                    You can add components to your app using the cli.
                  </AlertDescription>
                </Alert>

                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    Your session has expired. Please log in again.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label>Progress</Label>
                  <Progress value={33} />
                </div>

                <div className="space-y-2">
                  <Label>Skeleton</Label>
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Advanced Components */}
        <div className="flex flex-col gap-8 md:col-span-2 xl:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Components</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Label>Calendar</Label>
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border shadow"
                />
              </div>
              
              <div className="space-y-8">
                <div className="space-y-4">
                  <Label>Input OTP</Label>
                  <InputOTP maxLength={6}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                
                <div className="space-y-4">
                  <Label>Breadcrumb</Label>
                  <Breadcrumb>
                    <BreadcrumbList>
                      <BreadcrumbItem>
                        <BreadcrumbLink href="/">Home</BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbLink href="/components">Components</BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
                      </BreadcrumbItem>
                    </BreadcrumbList>
                  </Breadcrumb>
                </div>
                
                <div className="space-y-4">
                  <Label>Pagination</Label>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious href="#" />
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink href="#">1</PaginationLink>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink href="#" isActive>
                          2
                        </PaginationLink>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink href="#">3</PaginationLink>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext href="#" />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bento Grid — portal dashboard reference */}
      <section id="bento-grid" className="mt-16 flex flex-col gap-10 border-t border-border/50 pt-12">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Bento Grid / Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Asymmetric tiles for ERP dashboards. Portals use BentoGrid, BentoMetricTile, BentoChartTile from packages/ui.
          </p>
        </div>
        <div className="grid auto-rows-min grid-cols-1 gap-4 md:grid-cols-4">
          <Card className="md:col-span-1">
            <CardHeader className="pb-2">
              <CardDescription>Total merchants</CardDescription>
              <CardTitle className="text-2xl tabular-nums">128</CardTitle>
            </CardHeader>
          </Card>
          <Card className="md:col-span-1">
            <CardHeader className="pb-2">
              <CardDescription>Orders (30d)</CardDescription>
              <CardTitle className="text-2xl tabular-nums">1,247</CardTitle>
            </CardHeader>
          </Card>
          <Card className="md:col-span-2 md:row-span-2">
            <CardHeader>
              <CardTitle>Activity chart</CardTitle>
              <CardDescription>Daily order count — BentoChartTile span-2</CardDescription>
            </CardHeader>
            <CardContent className="flex h-40 items-end gap-1 px-6 pb-6">
              {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-primary/80 transition-colors"
                  style={{ height: `${h}%` }}
                />
              ))}
            </CardContent>
          </Card>
          <Card className="md:col-span-1">
            <CardHeader className="pb-2">
              <CardDescription>Revenue (30d)</CardDescription>
              <CardTitle className="text-2xl tabular-nums">$84,320</CardTitle>
            </CardHeader>
          </Card>
          <Card className="md:col-span-4">
            <CardHeader>
              <CardTitle>Recent records</CardTitle>
              <CardDescription>Full-width table tile (col-span-4)</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>WDG-001</TableCell>
                    <TableCell><Badge variant="secondary">Active</Badge></TableCell>
                    <TableCell className="text-right tabular-nums">24</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Dark mode borders — regression reference for portal tokens */}
      <section id="dark-mode-borders" className="mt-16 flex flex-col gap-10 border-t border-border/50 pt-12">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Dark mode / Borders</h2>
          <p className="text-sm text-muted-foreground">
            Toggle dark mode above. Borders use 8% white alpha hairlines; surfaces use ring-1 ring-border.
            Portals mirror these tokens via packages/ui/styles/globals.css.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Card &amp; outline button</CardTitle>
              <CardDescription>ring-1 ring-border — no border + shadow stack.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-4">
              <Button variant="outline">Outline</Button>
              <Input placeholder="Input with dark:bg-input/30" className="max-w-xs" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Table dividers</CardTitle>
              <CardDescription>Row borders inherit softened --border token.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>WDG-001</TableCell>
                    <TableCell>24</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>WDG-002</TableCell>
                    <TableCell>8</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Shell header divider</CardTitle>
              <CardDescription>border-border/50 hairline — ERP and Store shell headers.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg ring-1 ring-border">
                <div className="flex h-10 items-center border-b border-border/50 px-4 text-xs text-muted-foreground">
                  Header · LocaleToggle · ModeToggle
                </div>
                <div className="bg-muted/30 p-4 text-xs text-muted-foreground">Main content area</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Phase 5 — HQ branch channel / order fulfillment */}
      <section id="phase-5-fulfillment" className="mt-16 flex flex-col gap-10 border-t border-border/50 pt-12">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Phase 5 — Order fulfillment</h2>
          <p className="text-sm text-muted-foreground">
            HQ ↔ Branch channel: shared OrderListFrame, FulfillmentTypeBadge, PickupVerifyDialog,
            DeliveryShipDialog. Propagate to @meridian/ui for admin, merchant, store portals.
          </p>
        </div>
        <Phase5FulfillmentShowcase />
      </section>

      {/* shadcn blocks — page frameworks (portal reference) */}
      <section className="mt-16 flex flex-col gap-10 border-t pt-12">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Page frameworks</h2>
          <p className="text-sm text-muted-foreground">
            Mapped to shadcn blocks — dashboard-01, sidebar-03, login-03. Portals mirror these in @meridian/ui.
          </p>
        </div>

        <Card id="framework-erp-shell">
          <CardHeader>
            <CardTitle>FW-SHELL-ERP (dashboard-01 + sidebar-03)</CardTitle>
            <CardDescription>Collapsible sidebar + inset header + main content area.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex min-h-48 overflow-hidden rounded-lg border">
              <div className="hidden w-48 shrink-0 border-r bg-sidebar p-3 md:block">
                <p className="text-xs font-medium text-sidebar-foreground">Navigation</p>
              </div>
              <div className="flex flex-1 flex-col">
                <div className="flex h-10 items-center border-b px-3 text-xs text-muted-foreground">
                  Header · SidebarTrigger · ModeToggle
                </div>
                <div className="flex-1 bg-muted/30 p-4 text-xs text-muted-foreground">Main content</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card id="framework-list-page">
          <CardHeader>
            <CardTitle>FW-LIST (dashboard-01 data table)</CardTitle>
            <CardDescription>PageHeader + filters + sticky Table.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-2xl font-semibold tracking-tight">Entity list</h3>
              <p className="text-sm text-muted-foreground">Description and primary action on the right.</p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Example row</TableCell>
                  <TableCell><Badge>Active</Badge></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card id="framework-auth">
          <CardHeader>
            <CardTitle>FW-AUTH (login-03)</CardTitle>
            <CardDescription>Muted canvas, brand mark, compact Card form, fixed ModeToggle.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative flex min-h-64 flex-col items-center justify-center rounded-lg bg-muted p-6">
              <div className="absolute right-4 top-4">
                <ModeToggle />
              </div>
              <div className="w-full max-w-xs space-y-4">
                <div className="text-center text-sm font-medium">MeridianERP</div>
                <Card>
                  <CardContent className="pt-6">
                    <Button className="w-full">Sign in</Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card id="framework-detail-page">
          <CardHeader>
            <CardTitle>FW-DETAIL (dashboard-01 cards)</CardTitle>
            <CardDescription>Breadcrumb + PageHeader + Card sections / Tabs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem><BreadcrumbLink href="#">CRM</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbPage>Contact</BreadcrumbPage></BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <h3 className="text-2xl font-semibold tracking-tight">Record detail</h3>
            <Card>
              <CardHeader><CardTitle className="text-base">Summary</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground">Metadata fields in a dense card.</CardContent>
            </Card>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function ContextMenuShortcut({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={`ml-auto text-xs tracking-widest text-muted-foreground ${className}`}
      {...props}
    />
  )
}
