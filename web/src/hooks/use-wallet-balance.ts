import { useState, useEffect } from "react";
import { useWallets } from "@privy-io/react-auth";
import { useWalletAddress } from "./use-wallet-address";

/**
 * Hook to get the wallet balance in ETH (or native token)
 * @returns balance in ETH and loading state
 */
export function useWalletBalance() {
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

                // Get the provider from the wallet
                const wallet = wallets[0];
                const provider = await wallet.getEthereumProvider();

                // Request balance using eth_getBalance
                const balanceHex = await provider.request({
                    method: 'eth_getBalance',
                    params: [walletAddress, 'latest'],
                });

                // Convert from hex to decimal (wei)
                const balanceWei = BigInt(balanceHex as string);
                
                // Convert from wei to ETH (divide by 10^18)
                const balanceEth = Number(balanceWei) / 1e18;
                
                setBalance(balanceEth.toFixed(4));
            } catch (err) {
                console.error('Error fetching balance:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch balance');
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
        refetch: () => {
            // Trigger re-fetch by updating a dependency
            if (isReady && walletAddress && wallets && wallets.length > 0) {
                const fetchBalance = async () => {
                    try {
                        setIsLoading(true);
                        const wallet = wallets[0];
                        const provider = await wallet.getEthereumProvider();
                        const balanceHex = await provider.request({
                            method: 'eth_getBalance',
                            params: [walletAddress, 'latest'],
                        });
                        const balanceWei = BigInt(balanceHex as string);
                        const balanceEth = Number(balanceWei) / 1e18;
                        setBalance(balanceEth.toFixed(4));
                        setIsLoading(false);
                    } catch (err) {
                        console.error('Error refetching balance:', err);
                        setError(err instanceof Error ? err.message : 'Failed to fetch balance');
                        setIsLoading(false);
                    }
                };
                fetchBalance();
            }
        },
    };
}
