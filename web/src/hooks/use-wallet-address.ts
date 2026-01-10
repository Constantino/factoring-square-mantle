import { useEffect, useMemo } from "react";
import { useWallets, usePrivy } from "@privy-io/react-auth";

/**
 * Hook to get the first connected Ethereum wallet address
 * Tries connected wallets first, then falls back to user's linked accounts (embedded wallets)
 * @returns The wallet address or null if no wallet is found
 */
export function useWalletAddress() {
    const { wallets, ready: walletsReady } = useWallets();
    const { ready: privyReady, user } = usePrivy();

    // Get the first wallet address (Privy is configured for Ethereum)
    // Wait for both Privy and wallets to be ready
    const isReady = privyReady && walletsReady;

    const walletAddress = useMemo(() => {
        if (!isReady) return null;

        // Priority 1: Look for Privy embedded wallet first
        if (wallets && wallets.length > 0) {
            const privyWallet = wallets.find(
                (w) => w.walletClientType === 'privy'
            );
            if (privyWallet) {
                return privyWallet.address;
            }
        }

        // Priority 2: Fallback to user's linked accounts (embedded wallets)
        if (user) {
            const linkedAccounts = user.linkedAccounts || [];
            const walletAccount = linkedAccounts.find(
                (account) => account.type === 'wallet'
            ) as { type: string; address?: string; walletClientType?: string } | undefined;

            if (walletAccount && 'address' in walletAccount && walletAccount.address) {
                return walletAccount.address;
            }
        }

        // Priority 3: If no Privy wallet, use first available wallet
        if (wallets && wallets.length > 0) {
            return wallets[0].address;
        }

        return null;
    }, [isReady, wallets, user]);

    // Debug logging
    useEffect(() => {
        if (isReady) {
            console.log('=== Wallet Address Debug ===');
            console.log('Wallets ready:', walletsReady);
            console.log('Privy ready:', privyReady);
            console.log('Wallets array:', wallets);
            console.log('Wallets count:', wallets?.length);
            if (wallets && wallets.length > 0) {
                wallets.forEach((w, i) => {
                    console.log(`Wallet ${i}:`, {
                        address: w.address,
                        type: w.walletClientType,
                        chainId: w.chainId
                    });
                });
            }
            console.log('User:', user);
            console.log('Selected Wallet Address:', walletAddress);
            console.log('========================');
        }
    }, [isReady, walletsReady, privyReady, wallets, user, walletAddress]);

    return {
        walletAddress,
        isReady,
        walletsReady,
        privyReady,
    };
}

