"use client"

import { useSidebar } from "@/components/ui/sidebar"
import { ChevronLeft, ChevronRight } from "lucide-react"

export function SidebarToggle() {
    const { toggleSidebar, state } = useSidebar()

    return (
        <button 
            onClick={toggleSidebar}
            className="fixed top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center bg-background hover:bg-accent text-foreground rounded-full border border-border shadow-md z-[100] transition-all duration-300 cursor-pointer"
            style={{
                left: state === "expanded" ? "calc(16rem - 0.75rem)" : "calc(3rem - 0.75rem)"
            }}
        >
            {state === "expanded" ? (
                <ChevronLeft className="h-4 w-4" />
            ) : (
                <ChevronRight className="h-4 w-4" />
            )}
        </button>
    )
}
