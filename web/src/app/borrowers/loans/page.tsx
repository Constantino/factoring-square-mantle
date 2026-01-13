"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useWallets } from "@privy-io/react-auth";
import { useWalletAddress } from "@/hooks/use-wallet-address";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { CreditScoreGauge } from "@/components/credit-score-gauge";
import { LoansTable } from "@/components/loans-table";
import { LoanStatsPieChart } from "@/components/loan-stats-pie-chart";
import { LoanRequestWithVault, LoanStats } from "@/types/loans";
import { getLoanRequestsByBorrowerWithVaults, repayLoan, getBorrowerStats } from "@/services/loanService";

export default function LoanDashboardPage() {
    const { walletAddress, walletsReady, privyReady } = useWalletAddress();
    const { wallets } = useWallets();
    const [copied, setCopied] = useState(false);
    const [loanRequests, setLoanRequests] = useState<LoanRequestWithVault[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loanStats, setLoanStats] = useState<LoanStats | null>(null);
    const [isLoadingStats, setIsLoadingStats] = useState(false);
    const creditScore = 725; // Example score - can be made dynamic later

    useEffect(() => {
        if (walletAddress) {
            fetchLoanRequests();
            fetchBorrowerStats();
        } else {
            setLoanRequests([]);
            setLoanStats(null);
        }
    }, [walletAddress]);

    const fetchLoanRequests = async () => {
        if (!walletAddress) return;

        try {
            setIsLoading(true);
            setError(null);

            const data = await getLoanRequestsByBorrowerWithVaults(walletAddress);
            setLoanRequests(data);
        } catch (err) {
            console.error("Error fetching loan requests:", err);
            if (axios.isAxiosError(err)) {
                setError(
                    err.response?.data?.error ||
                    err.response?.data?.message ||
                    err.message ||
                    "Failed to fetch loan requests"
                );
            } else {
                setError(err instanceof Error ? err.message : "An unexpected error occurred");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const fetchBorrowerStats = async () => {
        if (!walletAddress) return;

        try {
            setIsLoadingStats(true);
            const stats = await getBorrowerStats(walletAddress);
            setLoanStats(stats);
        } catch (err) {
            console.error("Error fetching borrower stats:", err);
            // Don't set error state for stats - just log it
        } finally {
            setIsLoadingStats(false);
        }
    };

    const handleCopy = async () => {
        if (!walletAddress) return;

        try {
            await navigator.clipboard.writeText(walletAddress);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    const handleView = (requestId: number) => {
        // TODO: Implement view functionality
        console.log("View request:", requestId);
    };

    const handlePayLoan = async (requestId: number, amount: number, onProgress?: (step: string) => void): Promise<string> => {
        if (!wallets || wallets.length === 0) {
            throw new Error("No wallet connected. Please connect a wallet first.");
        }

        // Find the loan request by ID
        const loanRequest = loanRequests.find(req => req.id === requestId);
        if (!loanRequest) {
            throw new Error(`Loan request with ID ${requestId} not found`);
        }

        // Check if vault address exists
        if (!loanRequest.vault_address) {
            throw new Error("Vault address not found for this loan request");
        }

        // Get the first wallet (Privy wallet)
        const wallet = wallets[0];
        if (!wallet) {
            throw new Error("Wallet not available");
        }

        try {
            onProgress?.("Starting loan repayment...");
            const txHash = await repayLoan(
                loanRequest.vault_address,
                amount,
                wallet,
                loanRequest.id,
                onProgress
            );

            // Refresh loan requests and stats after successful repayment
            await fetchLoanRequests();
            await fetchBorrowerStats();

            return txHash;
        } catch (error) {
            console.error("Error repaying loan:", error);
            throw error;
        }
    };

    return (
        <div className="w-full p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <div>
                    <h1 className="text-4xl font-bold mb-4 text-foreground">Loan Dashboard</h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Card
                        initial={false}
                        whileHover={undefined}
                    >
                        <CardHeader className="p-4">
                            <CardTitle className="text-base">Stats</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            {isLoadingStats ? (
                                <div className="text-xs text-muted-foreground text-center py-4">Loading...</div>
                            ) : loanStats ? (
                                <LoanStatsPieChart stats={loanStats} />
                            ) : (
                                <div className="text-xs text-muted-foreground text-center py-4">No stats available</div>
                            )}
                        </CardContent>
                    </Card>

                    <Card
                        initial={false}
                        whileHover={undefined}
                    >
                        <CardHeader className="p-4">
                            <CardTitle className="text-base">Balances</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="space-y-3">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-foreground">
                                        USDC Balance
                                    </label>
                                    <div className="px-3 py-1.5 bg-muted rounded-md text-xs text-foreground">
                                        $0.00
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-foreground">
                                        Debt
                                    </label>
                                    <div className="px-3 py-1.5 bg-muted rounded-md text-xs text-foreground">
                                        $0.00
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card
                        initial={false}
                        whileHover={undefined}
                    >
                        <CardHeader className="p-4">
                            <CardTitle className="text-base">On-chain Credit Score</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <CreditScoreGauge score={creditScore} />
                        </CardContent>
                    </Card>
                </div>

                {/* Loans Table */}
                <LoansTable
                    loanRequests={loanRequests}
                    isLoading={isLoading}
                    error={error}
                    onView={handleView}
                    onPay={handlePayLoan}
                />
            </div>
        </div>
    );
}

