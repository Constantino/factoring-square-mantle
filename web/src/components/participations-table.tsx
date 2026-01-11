"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LenderParticipation } from "@/types/vault";

interface ParticipationsTableProps {
    participations: LenderParticipation[];
    isLoading: boolean;
    error: string | null;
}

export function ParticipationsTable({
    participations,
    isLoading,
    error,
}: ParticipationsTableProps) {
    const formatCurrency = (value: string) => {
        return `$${parseFloat(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

    const getCapacityPercentage = (current: string, max: string) => {
        const currentNum = parseFloat(current);
        const maxNum = parseFloat(max);
        return ((currentNum / maxNum) * 100).toFixed(1);
    };

    return (
        <Card
            initial={false}
            whileHover={undefined}
        >
            <CardHeader>
                <CardTitle className="text-base">Portafolio</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left py-3 px-4 text-xs font-semibold text-foreground">
                                    Vault Name
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-foreground">
                                    Vault Address
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-foreground">
                                    Borrower
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-foreground">
                                    Amount Invested
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-foreground">
                                    Vault Capacity
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-foreground">
                                    Filled
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-foreground">
                                    Date
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-foreground">
                                    Transaction
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={8} className="py-8 px-4 text-center text-xs text-muted-foreground">
                                        Loading participations...
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan={8} className="py-8 px-4 text-center text-xs text-destructive">
                                        {error}
                                    </td>
                                </tr>
                            ) : participations.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-12 px-4 text-center">
                                        <p className="text-sm text-muted-foreground mb-2">
                                            You don't have any loan participations yet
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Explore the <a href="/vaults" className="text-primary hover:underline font-medium">existing vaults</a> to start investing
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                participations.map((participation) => (
                                    <tr key={participation.lender_id} className="border-b border-border hover:bg-muted/50 transition-colors">
                                        <td className="py-3 px-4 text-xs text-foreground">
                                            {participation.vault_name}
                                        </td>
                                        <td className="py-3 px-4 text-xs text-foreground font-mono">
                                            {truncateAddress(participation.vault_address)}
                                        </td>
                                        <td className="py-3 px-4 text-xs text-foreground font-mono">
                                            {truncateAddress(participation.borrower_address)}
                                        </td>
                                        <td className="py-3 px-4 text-xs text-foreground font-semibold">
                                            {formatCurrency(participation.amount)}
                                        </td>
                                        <td className="py-3 px-4 text-xs text-foreground">
                                            {formatCurrency(participation.current_capacity)} / {formatCurrency(participation.max_capacity)}
                                        </td>
                                        <td className="py-3 px-4 text-xs text-foreground">
                                            {getCapacityPercentage(participation.current_capacity, participation.max_capacity)}%
                                        </td>
                                        <td className="py-3 px-4 text-xs text-foreground">
                                            {formatDate(participation.created_at)}
                                        </td>
                                        <td className="py-3 px-4 text-xs text-foreground font-mono">
                                            <a
                                                href={`https://explorer.sepolia.mantle.xyz/tx/${participation.tx_hash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-500 hover:text-blue-700 underline"
                                            >
                                                {truncateAddress(participation.tx_hash)}
                                            </a>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
