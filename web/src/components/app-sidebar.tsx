"use client"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Users, LogOut } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useUserStore } from "@/stores/userStore"
import { usePrivy } from "@privy-io/react-auth"
import { Separator } from "@/components/ui/separator"

export function AppSidebar() {
    const logout = useUserStore((state) => state.logout)
    const { logout: privyLogout } = usePrivy()
    const router = useRouter()

    const handleLogout = () => {
        logout()
        privyLogout()
        router.push('/')
    }

    const menuItems = [
        {
            title: "Users",
            url: "/users",
            icon: Users,
        },
    ]

    return (
        <Sidebar side="left" variant="sidebar">
            <SidebarHeader>
                <div className="px-2 py-2">
                    <h2 className="text-lg font-semibold">Factoring Square</h2>
                </div>
            </SidebarHeader>
      
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
                        <SidebarMenuButton onClick={handleLogout}>
                            <LogOut />
                            <span>Logout</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
