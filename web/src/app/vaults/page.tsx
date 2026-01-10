"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ParticipateModal } from "@/components/participate-modal";

interface Vault {
    vault_id: number;
    vault_address: string;
    borrower_address: string;
    vault_name: string;
    max_capacity: string;
    current_capacity: string;
    created_at: string;
    modified_at: string;
}

export default function VaultsPage() {
    const [vaults, setVaults] = useState<Vault[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedVault, setSelectedVault] = useState<Vault | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchVaults();
    }, []);

    const fetchVaults = async () => {
        try {
            setIsLoading(true);
            setError(null);

            let apiUrl = process.env.NEXT_PUBLIC_API_URL;
            if (!apiUrl) {
                throw new Error("NEXT_PUBLIC_API_URL is not configured");
            }

            // Ensure the URL has a protocol
            if (!apiUrl.startsWith("http://") && !apiUrl.startsWith("https://")) {
                apiUrl = `http://${apiUrl}`;
            }

            // Remove trailing slash if present
            apiUrl = apiUrl.replace(/\/$/, "");

            const response = await axios.get(`${apiUrl}/vaults`);
            setVaults(response.data.data || []);
        } catch (err) {
            console.error("Error fetching vaults:", err);
            if (axios.isAxiosError(err)) {
                setError(
                    err.response?.data?.error ||
                    err.response?.data?.message ||
                    err.message ||
                    "Failed to fetch vaults"
                );
            } else {
                setError("An unexpected error occurred");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const truncateAddress = (address: string) => {
        if (!address) return "";
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const handleParticipate = (vault: Vault) => {
        setSelectedVault(vault);
        setIsModalOpen(true);
    };

    const handleConfirmParticipation = (amount: number) => {
        // TODO: Implement actual participation logic with smart contract
        console.log('Participating in vault:', selectedVault?.vault_id, 'with amount:', amount);
        // Here you would call your smart contract to participate in the vault
    };

    return (
        <div className="w-full p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-bold mb-2 text-foreground">Vaults</h1>
                    <p className="text-lg text-muted-foreground">
                        View all deployed vaults
                    </p>
                </div>

                {/* Error State */}
                {error && (
                    <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                        <p className="text-sm text-destructive">{error}</p>
                    </div>
                )}

                {/* Loading State */}
                {isLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <Card key={i} className="p-6">
                                <Skeleton className="h-6 w-3/4 mb-4" />
                                <Skeleton className="h-4 w-full mb-2" />
                                <Skeleton className="h-4 w-full mb-2" />
                                <Skeleton className="h-4 w-2/3" />
                            </Card>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && !error && vaults.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground text-lg">No vaults found</p>
                        <p className="text-muted-foreground text-sm mt-2">
                            Create your first vault to get started
                        </p>
                    </div>
                )}

                {/* Vaults Grid */}
                {!isLoading && !error && vaults.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {vaults.map((vault) => (
                            <Card key={vault.vault_id} className="overflow-hidden">
                                <CardHeader className="bg-muted/50">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <span className="truncate">{vault.vault_name}</span>
                                    </CardTitle>
                                    <CardDescription className="font-mono text-xs">
                                        {truncateAddress(vault.vault_address)}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Borrower</p>
                                        <p className="font-mono text-sm">
                                            {truncateAddress(vault.borrower_address)}
                                        </p>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Max Capacity</p>
                                            <p className="font-semibold text-sm">
                                                ${parseFloat(vault.max_capacity).toLocaleString()}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Current</p>
                                            <p className="font-semibold text-sm">
                                                ${parseFloat(vault.current_capacity).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Created</p>
                                        <p className="text-sm">{formatDate(vault.created_at)}</p>
                                    </div>

                                    {/* Progress Bar */}
                                    <div>
                                        <div className="flex justify-between text-xs text-muted-foreground mb-2">
                                            <span>Capacity Used</span>
                                            <span>
                                                {((parseFloat(vault.current_capacity) / parseFloat(vault.max_capacity)) * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary transition-all duration-300"
                                                style={{
                                                    width: `${Math.min(100, (parseFloat(vault.current_capacity) / parseFloat(vault.max_capacity)) * 100)}%`
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Participate Button */}
                                    <Button 
                                        className="w-full mt-2"
                                        onClick={() => handleParticipate(vault)}
                                    >
                                        Participate
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Participate Modal */}
            <ParticipateModal
                vault={selectedVault}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirmParticipation}
            />
        </div>
    );
}
