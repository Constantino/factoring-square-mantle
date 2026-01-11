"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useWalletAddress } from "@/hooks/use-wallet-address";
import { PortfolioTable } from "@/components/portfolio-table";
import { LenderPortfolio } from "@/types/vault";
import { fetchLenderPortfolio } from "@/services/vault";

export default function LenderLoansPage() {
    const { walletAddress } = useWalletAddress();
    const [portfolio, setPortfolio] = useState<LenderPortfolio[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
                />
            </div>
        </div>
    );
}
