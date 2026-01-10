import { useState, useEffect } from "react";
import { useWallets } from "@privy-io/react-auth";
import { useWalletAddress } from "./use-wallet-address";
import { ethers } from "ethers";

// Minimal ERC20 ABI for balance checking
const ERC20_BALANCE_ABI = [
    {
        "inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
        "name": "balanceOf",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    }
] as const;

/**
 * Hook to get the USDC balance
 * @returns balance in USDC and loading state
 */
export function useUSDCBalance() {
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

            const usdcAddress = process.env.NEXT_PUBLIC_USDC_ADDRESS;
            if (!usdcAddress) {
                setError("USDC address not configured");
                return;
            }

            try {
                setIsLoading(true);
                setError(null);

                // Get the provider from the wallet
                const wallet = wallets[0];
                const provider = await wallet.getEthereumProvider();
                const ethersProvider = new ethers.BrowserProvider(provider);

                // Create USDC contract instance
                const usdcContract = new ethers.Contract(
                    usdcAddress,
                    ERC20_BALANCE_ABI,
                    ethersProvider
                );

                // Get balance
                const balanceWei = await usdcContract.balanceOf(walletAddress);
                
                // Convert from wei to USDC (6 decimals)
                const balanceUsdc = Number(balanceWei) / 1e6;
                
                setBalance(balanceUsdc.toFixed(2));
            } catch (err) {
                console.error('Error fetching USDC balance:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch USDC balance');
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
