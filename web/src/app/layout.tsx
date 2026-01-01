"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import {PrivyClientConfig, PrivyProvider} from '@privy-io/react-auth';
import Navbar from "@/components/navbar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useUserStore } from "@/stores/userStore";
import { usePrivy } from "@privy-io/react-auth";
import { useEffect } from "react";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

const privyConfig: PrivyClientConfig = {
    // Create embedded wallets for users who don't have a wallet
    embeddedWallets: {
        ethereum: {
            createOnLogin: 'users-without-wallets'
        }
    }
}

function LayoutContent({ children }: { children: React.ReactNode }) {
    const { isLoggedIn, login, logout } = useUserStore();
    const { ready, authenticated, user } = usePrivy();

    // Sync Privy authentication state with userStore
    useEffect(() => {
        if (!ready) return;

        if (authenticated && !isLoggedIn && user) {
            // User is authenticated in Privy but not in our store
            login({
                id: user.id,
                email: user.email?.address,
            });
        } else if (!authenticated && isLoggedIn) {
            // User is logged out in Privy but still logged in our store
            logout();
        }
    }, [ready, authenticated, isLoggedIn, user, login, logout]);

    if (!isLoggedIn) {
        return (
            <>
                <Navbar />
                {children}
            </>
        );
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <Navbar />
                {children}
            </SidebarInset>
        </SidebarProvider>
    );
}

export default function RootLayout({
    children,
}: Readonly<{
  children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                <PrivyProvider
                    appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
                    clientId={process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID || ""}
                    config={privyConfig}
                >
                    <LayoutContent>{children}</LayoutContent>
                </PrivyProvider>
            </body>
        </html>
    );
}
