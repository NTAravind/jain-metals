"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter
} from "@/components/ui/sidebar"
import {
  LayoutDashboard,
  ShoppingCart,
  Package2,
  Tag,
  Users,
  List,
  Truck,
  TicketPercent,
  PercentCircle,
  Layers,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Products", href: "/admin/products", icon: Package2 },
  { label: "Categories", href: "/admin/categories", icon: List },
  { label: "Collections", href: "/admin/collections", icon: Layers },
  { label: "Discounts", href: "/admin/discounts", icon: PercentCircle },
  { label: "Coupons", href: "/admin/coupons", icon: TicketPercent },
  { label: "Delivery", href: "/admin/delivery", icon: Truck },
  { label: "Customers", href: "/admin/customers", icon: Users },
]

export function AppSidebar() {
  const pathname = usePathname()
  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin"
    }
    return pathname === href || pathname.startsWith(href + "/")
  }
  return (
    <Sidebar className="border-r border-black/5">
      <SidebarHeader className="px-6 py-6 border-b border-black/5 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-default">
            <span className="text-white text-sm font-bold tracking-tighter">JM</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-black tracking-tight leading-none mb-1">Jain Metals</span>
            <span className="text-[10px] uppercase tracking-widest text-black/40 font-bold">Admin Foundry</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-white px-2 pt-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-black/30 text-[10px] font-bold uppercase tracking-[0.2em] mb-4 px-4">Menu</SidebarGroupLabel>
          <SidebarMenu className="gap-1">
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive(item.href)}
                  className="h-11 px-4 rounded-lg transition-all duration-200 hover:bg-black/5 data-[active=true]:bg-black data-[active=true]:text-white data-[active=true]:shadow-md group"
                >
                  <Link href={item.href} className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 transition-transform group-active:scale-90" />
                    <span className="text-sm font-medium tracking-tight font-sans">{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-black/5 bg-white">
      </SidebarFooter>
    </Sidebar>
  )
}
