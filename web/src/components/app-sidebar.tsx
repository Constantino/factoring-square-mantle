"use client"

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarTrigger,
    useSidebar,
} from "@/components/ui/sidebar"
import { Users, ChevronLeft, ChevronRight, Building2, Receipt, Vault, CreditCard, Wallet, LucideIcon, LayoutDashboard } from "lucide-react"
import Link from "next/link"
import { useRoleStore, UserRole } from "@/stores/roleStore"
import { NotificationBadge } from "@/components/notification-badge"

interface MenuItem {
    title: string;
    url: string;
    icon: LucideIcon;
    roles: UserRole[];
}

export function AppSidebar() {
    const { currentRole } = useRoleStore()
    const { state } = useSidebar()

    const allMenuItems: MenuItem[] = [
        {
            title: "Users",
            url: "/users",
            icon: Users,
            roles: ['Admin'],
        },
        {
            title: "Admin panel",
            url: "/admin",
            icon: LayoutDashboard,
            roles: ['Admin'],
        },
        {
            title: "My loans",
            url: "/borrowers/loans",
            icon: CreditCard,
            roles: ['Admin', 'Borrower'],
        },
        {
            title: "Request Loan",
            url: "/loan-request",
            icon: Receipt,
            roles: ['Admin', 'Borrower'],
        },
        {
            title: "Borrower KYB",
            url: "/borrower-kyb",
            icon: Building2,
            roles: ['Admin', 'Borrower'],
        },
        {
            title: "Vaults",
            url: "/vaults",
            icon: Vault,
            roles: ['Admin', 'Lender'],
        },
        {
            title: "Portfolio",
            url: "/lenders/loans",
            icon: Wallet,
            roles: ['Admin', 'Lender'],
        },
    ]

    // Filter menu items based on current role
    const menuItems = allMenuItems.filter(item => item.roles.includes(currentRole))

    return (
        <Sidebar side="left" variant="sidebar" collapsible="icon" className="pt-16 relative">
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {menuItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild className="relative">
                                        <Link href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                            {item.title === "Admin panel" && (
                                                <NotificationBadge count={1} />
                                            )}
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            {/* Collapse trigger button */}
            <div className="absolute top-1/2 -translate-y-1/2 -right-3 z-50">
                <SidebarTrigger className="h-6 w-6 flex items-center justify-center bg-background hover:bg-accent text-foreground rounded-full border border-border shadow-md">
                    {state === "expanded" ? (
                        <ChevronLeft className="h-4 w-4" />
                    ) : (
                        <ChevronRight className="h-4 w-4" />
                    )}
                </SidebarTrigger>
            </div>
        </Sidebar>
    )
}
