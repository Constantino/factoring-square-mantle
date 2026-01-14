"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useWallets } from "@privy-io/react-auth";
import { useWalletAddress } from "@/hooks/use-wallet-address";
import { PortfolioTable } from "@/components/portfolio-table";
import { RedeemModal } from "@/components/redeem-modal";
import { LenderPortfolio } from "@/types/vault";
import { fetchLenderPortfolio, redeemShares, previewRedemption } from "@/services/vault";

export default function LenderLoansPage() {
    const { walletAddress } = useWalletAddress();
    const { wallets } = useWallets();
    const [portfolio, setPortfolio] = useState<LenderPortfolio[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Redeem modal state
    const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);
    const [selectedVault, setSelectedVault] = useState<{ 
        address: string; 
        amount: number; 
        lenderId: number;
        sharesAmount?: string;
    } | null>(null);
    const [isRedeeming, setIsRedeeming] = useState(false);
    const [redeemStep, setRedeemStep] = useState<string>("Processing...");
    const [redeemTxHash, setRedeemTxHash] = useState<string | null>(null);
    const [redeemableAmount, setRedeemableAmount] = useState<number | undefined>(undefined);
    const [sharesToRedeem, setSharesToRedeem] = useState<bigint | undefined>(undefined);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);

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

    const handleRedeem = async (
        vaultAddress: string, 
        investedAmount: number, 
        lenderId: number,
        sharesAmount?: string
    ) => {
        setSelectedVault({ address: vaultAddress, amount: investedAmount, lenderId, sharesAmount });
        setRedeemableAmount(undefined);
        setIsRedeemModalOpen(true);
        setRedeemTxHash(null);

        // Preview redemption amount
        if (!wallets || wallets.length === 0) {
            console.error("No wallet connected for preview");
            return;
        }

        const wallet = wallets[0];
        if (!wallet) {
            console.error("Wallet not available for preview");
            return;
        }

        try {
            setIsLoadingPreview(true);
            const preview = await previewRedemption(vaultAddress, investedAmount, sharesAmount, wallet);
            setRedeemableAmount(preview.redeemableAmount);
            setSharesToRedeem(preview.sharesToRedeem);
        } catch (error) {
            console.error("Error previewing redemption:", error);
            // Don't block modal opening if preview fails
        } finally {
            setIsLoadingPreview(false);
        }
    };

    const handleRedeemConfirm = async () => {
        if (!selectedVault || !wallets || wallets.length === 0) {
            throw new Error("No wallet connected");
        }

        if (!sharesToRedeem) {
            throw new Error("Shares amount not calculated. Please try again.");
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
                sharesToRedeem,
                selectedVault.lenderId,
                wallet,
                (step: string) => setRedeemStep(step)
            );

            setRedeemTxHash(result.txHash);
            setRedeemableAmount(result.redeemedAmount);

            // Wait for blockchain state to update before refreshing
            await new Promise(resolve => setTimeout(resolve, 2000));
            
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
            setSharesToRedeem(undefined);
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
                        isLoadingPreview={isLoadingPreview}
                    />
                )}
            </div>
        </div>
    );
}
