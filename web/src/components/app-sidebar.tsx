"use client"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarTrigger,
    useSidebar,
} from "@/components/ui/sidebar"
import { Users, LogOut, ChevronLeft, ChevronRight, Building2, Receipt, Vault, CreditCard, Wallet, LucideIcon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useUserStore } from "@/stores/userStore"
import { useRoleStore, UserRole } from "@/stores/roleStore"
import { usePrivy } from "@privy-io/react-auth"
import { Separator } from "@/components/ui/separator"

interface MenuItem {
    title: string;
    url: string;
    icon: LucideIcon;
    roles: UserRole[];
}

export function AppSidebar() {
    const logout = useUserStore((state) => state.logout)
    const { currentRole } = useRoleStore()
    const { logout: privyLogout } = usePrivy()
    const router = useRouter()
    const { state } = useSidebar()

    const handleLogout = () => {
        logout()
        privyLogout()
        router.push('/')
    }

    const allMenuItems: MenuItem[] = [
        {
            title: "Users",
            url: "/users",
            icon: Users,
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
                                    <SidebarMenuButton asChild>
                                        <Link href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <Separator />
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={handleLogout} className="text-red-500 hover:text-red-600">
                            <LogOut />
                            <span>Logout</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>

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
