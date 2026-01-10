import { useState, useEffect } from "react";
import { useWallets } from "@privy-io/react-auth";
import { useWalletAddress } from "./use-wallet-address";
import { ethers } from "ethers";

/**
 * Hook to get the native MNT token balance on Mantle Sepolia
 * MNT is the native token on Mantle Sepolia (like ETH on Ethereum)
 * @returns balance in MNT and loading state
 */
export function useMNTBalance() {
    const { walletAddress, isReady } = useWalletAddress();
    const { wallets } = useWallets();
    const [balance, setBalance] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBalance = async () => {
            if (!isReady || !walletAddress || !wallets || wallets.length === 0) {
                return;
            }

            try {
                setIsLoading(true);
                setError(null);

                // Connect directly to Mantle Sepolia RPC
                const mantleSepoliaRpc = 'https://rpc.sepolia.mantle.xyz';
                const provider = new ethers.JsonRpcProvider(mantleSepoliaRpc);

                // Get native balance (MNT is the native token on Mantle)
                const balanceWei = await provider.getBalance(walletAddress);
                
                // Convert from wei to MNT (18 decimals)
                const balanceMnt = Number(balanceWei) / 1e18;
                
                setBalance(balanceMnt.toFixed(4));
            } catch (err) {
                console.error('Error fetching MNT balance:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch MNT balance');
                setBalance(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBalance();
    }, [isReady, walletAddress, wallets]);

    return {
        balance,
        isLoading,
        error,
    };
}
