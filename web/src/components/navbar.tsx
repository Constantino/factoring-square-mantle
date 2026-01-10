'use client';

import Link from "next/link";
import { useUserStore } from "@/stores/userStore";
import { useWalletBalance } from "@/hooks/use-wallet-balance";
import { useUSDCBalance } from "@/hooks/use-usdc-balance";
import { useMNTBalance } from "@/hooks/use-mnt-balance";
import { useWalletAddress } from "@/hooks/use-wallet-address";
import {
    TooltipProvider,
} from "@/components/ui/tooltip";
import { CopyButton } from "@/components/copy-button";

const Navbar = () => {
    const { isLoggedIn, user } = useUserStore();
    const { balance, isLoading } = useWalletBalance();
    const { balance: usdcBalance, isLoading: isLoadingUsdc } = useUSDCBalance();
    const { balance: mntBalance, isLoading: isLoadingMnt } = useMNTBalance();

    const { walletAddress } = useWalletAddress();

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
                        <div className="flex flex-col gap-1">
                            {/* Row 1: Balances and Username */}
                            <div className="flex items-center gap-4">
                                {/* ETH Balance */}
                                <div className="text-sm text-muted-foreground">
                                    {isLoading ? (
                                        <span>Loading...</span>
                                    ) : (
                                        <span className="font-mono">{balance || '0.0000'} ETH</span>
                                    )}
                                </div>

                                {/* MNT Balance */}
                                <div className="text-sm text-muted-foreground">
                                    {isLoadingMnt ? (
                                        <span>Loading...</span>
                                    ) : (
                                        <span className="font-mono">{mntBalance || '0.0000'} MNT</span>
                                    )}
                                </div>

                                {/* USDC Balance */}
                                <div className="text-sm text-muted-foreground">
                                    {isLoadingUsdc ? (
                                        <span>Loading...</span>
                                    ) : (
                                        <span className="font-mono">${usdcBalance || '0.00'} USDC</span>
                                    )}
                                </div>
                                
                                {/* Username */}
                                <div className="text-sm text-foreground font-medium">
                                    {getUserName()}
                                </div>
                            </div>

                            {/* Row 2: Wallet Address with Copy */}
                            {walletAddress && (
                                <TooltipProvider>
                                    <div className="flex items-center gap-2">
                                        <CopyButton
                                            textToCopy={walletAddress}
                                            displayText={walletAddress}
                                            iconSize={12}
                                            textSize="xs"
                                            showText={true}
                                        />
                                    </div>
                                </TooltipProvider>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
