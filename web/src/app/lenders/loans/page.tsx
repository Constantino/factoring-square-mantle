"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useWalletAddress } from "@/hooks/use-wallet-address";
import { ParticipationsTable } from "@/components/participations-table";
import { LenderParticipation } from "@/types/vault";
import { fetchLenderParticipations } from "@/services/vault";

export default function LenderLoansPage() {
    const { walletAddress } = useWalletAddress();
    const [participations, setParticipations] = useState<LenderParticipation[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (walletAddress) {
            fetchParticipations();
        } else {
            setParticipations([]);
        }
    }, [walletAddress]);

    const fetchParticipations = async () => {
        if (!walletAddress) return;

        try {
            setIsLoading(true);
            setError(null);

            const data = await fetchLenderParticipations(walletAddress);
            setParticipations(data);
        } catch (err) {
            console.error("Error fetching participations:", err);
            if (axios.isAxiosError(err)) {
                setError(
                    err.response?.data?.error ||
                    err.response?.data?.message ||
                    err.message ||
                    "Failed to fetch participations"
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
                    <h1 className="text-4xl font-bold mb-4 text-foreground">Portafolio</h1>
                </div>

                {/* Participations Table */}
                <ParticipationsTable
                    participations={participations}
                    isLoading={isLoading}
                    error={error}
                />
            </div>
        </div>
    );
}
