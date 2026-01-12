"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useWallets } from "@privy-io/react-auth";
import { useWalletAddress } from "@/hooks/use-wallet-address";
import { PortfolioTable } from "@/components/portfolio-table";
import { RedeemModal } from "@/components/redeem-modal";
import { LenderPortfolio } from "@/types/vault";
import { fetchLenderPortfolio, redeemShares } from "@/services/vault";

export default function LenderLoansPage() {
    const { walletAddress } = useWalletAddress();
    const { wallets } = useWallets();
    const [portfolio, setPortfolio] = useState<LenderPortfolio[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Redeem modal state
    const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);
    const [selectedVault, setSelectedVault] = useState<{ address: string; amount: number } | null>(null);
    const [isRedeeming, setIsRedeeming] = useState(false);
    const [redeemStep, setRedeemStep] = useState<string>("Processing...");
    const [redeemTxHash, setRedeemTxHash] = useState<string | null>(null);
    const [redeemableAmount, setRedeemableAmount] = useState<number | undefined>(undefined);

    useEffect(() => {
        if (walletAddress) {
            fetchPortfolioData();
        } else {
            setPortfolio([]);
        }
    }, [walletAddress]);

    const fetchPortfolioData = async () => {
        if (!walletAddress) return;

        try {
            setIsLoading(true);
            setError(null);

            const data = await fetchLenderPortfolio(walletAddress);
            setPortfolio(data);
        } catch (err) {
            console.error("Error fetching portfolio:", err);
            if (axios.isAxiosError(err)) {
                setError(
                    err.response?.data?.error ||
                    err.response?.data?.message ||
                    err.message ||
                    "Failed to fetch portfolio"
                );
            } else {
                setError(err instanceof Error ? err.message : "An unexpected error occurred");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleRedeem = (vaultAddress: string, investedAmount: number) => {
        setSelectedVault({ address: vaultAddress, amount: investedAmount });
        setRedeemableAmount(undefined); // Will be calculated during redemption
        setIsRedeemModalOpen(true);
        setRedeemTxHash(null);
    };

    const handleRedeemConfirm = async () => {
        if (!selectedVault || !wallets || wallets.length === 0) {
            throw new Error("No wallet connected");
        }

        const wallet = wallets[0];
        if (!wallet) {
            throw new Error("Wallet not available");
        }

        try {
            setIsRedeeming(true);
            setRedeemTxHash(null);

            const result = await redeemShares(
                selectedVault.address,
                wallet,
                (step: string) => setRedeemStep(step)
            );

            setRedeemTxHash(result.txHash);
            setRedeemableAmount(result.redeemedAmount);

            // Refresh portfolio after successful redemption
            await fetchPortfolioData();

            // Close modal after a delay
            setTimeout(() => {
                setIsRedeemModalOpen(false);
                setSelectedVault(null);
            }, 3000);
        } catch (error) {
            console.error("Error redeeming shares:", error);
            throw error;
        } finally {
            setIsRedeeming(false);
        }
    };

    const handleRedeemClose = () => {
        if (!isRedeeming) {
            setIsRedeemModalOpen(false);
            setSelectedVault(null);
            setRedeemTxHash(null);
            setRedeemableAmount(undefined);
        }
    };

    return (
        <div className="w-full p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <div>
                    <h1 className="text-4xl font-bold mb-4 text-foreground">Portfolio</h1>
                </div>

                {/* Portfolio Table */}
                <PortfolioTable
                    portfolio={portfolio}
                    isLoading={isLoading}
                    error={error}
                    onRedeem={handleRedeem}
                />

                {/* Redeem Modal */}
                {selectedVault && (
                    <RedeemModal
                        isOpen={isRedeemModalOpen}
                        onClose={handleRedeemClose}
                        onConfirm={handleRedeemConfirm}
                        investedAmount={selectedVault.amount}
                        redeemableAmount={redeemableAmount}
                        isProcessing={isRedeeming}
                        processingStep={redeemStep}
                        txHash={redeemTxHash}
                    />
                )}
            </div>
        </div>
    );
}
