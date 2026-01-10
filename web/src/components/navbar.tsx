'use client';

import Link from "next/link";
import { useUserStore } from "@/stores/userStore";
import { useWalletBalance } from "@/hooks/use-wallet-balance";

const Navbar = () => {
    const { isLoggedIn, user } = useUserStore();
    const { balance, isLoading } = useWalletBalance();

    // Extract username from email (text before @)
    const getUserName = () => {
        if (!user?.email) return '';
        return user.email.split('@')[0];
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
            <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo/Brand */}
                    <Link href="/" className="text-xl font-bold text-foreground font-mono flex items-center gap-2">
                        <div className="w-3 h-3 bg-primary"></div>
                        Factoring Square
                    </Link>

                    {/* User Info */}
                    {isLoggedIn && user?.email && (
                        <div className="flex items-center gap-4">
                            {/* Wallet Balance */}
                            {balance !== null && (
                                <div className="text-sm text-muted-foreground">
                                    {isLoading ? (
                                        <span>Loading...</span>
                                    ) : (
                                        <span className="font-mono">{balance} ETH</span>
                                    )}
                                </div>
                            )}
                            
                            {/* Username */}
                            <div className="text-sm text-foreground font-medium">
                                {getUserName()}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
