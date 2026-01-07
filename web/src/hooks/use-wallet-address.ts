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
        // Try to get wallet address from connected wallets first
        if (isReady && wallets && wallets.length > 0) {
            return wallets[0].address;
        } else if (user) {
            // Fallback: check user's linked accounts (embedded wallets)
            const linkedAccounts = user.linkedAccounts || [];
            const walletAccount = linkedAccounts.find(
                (account) => account.type === 'wallet'
            ) as { type: string; address?: string; walletClientType?: string } | undefined;

            if (walletAccount && 'address' in walletAccount && walletAccount.address) {
                return walletAccount.address;
            }
        }
        return null;
    }, [isReady, wallets, user]);

    // Debug logging
    useEffect(() => {
        if (isReady) {
            console.log('Wallets ready:', walletsReady);
            console.log('Privy ready:', privyReady);
            console.log('Wallets array:', wallets);
            console.log('Wallets length:', wallets?.length);
            console.log('User:', user);
            console.log('Wallet Address:', walletAddress);
        }
    }, [isReady, walletsReady, privyReady, wallets, user, walletAddress]);

    return {
        walletAddress,
        isReady,
        walletsReady,
        privyReady,
    };
}

