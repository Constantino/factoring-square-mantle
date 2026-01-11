"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LenderPortfolio } from "@/types/vault";
import { formatCurrency, formatDate, truncateAddress, formatCapacityPercentage } from "@/lib/format";

interface PortfolioTableProps {
    portfolio: LenderPortfolio[];
    isLoading: boolean;
    error: string | null;
}

export function PortfolioTable({
    portfolio,
    isLoading,
    error,
}: PortfolioTableProps) {

    return (
        <Card
            initial={false}
            whileHover={undefined}
        >
            <CardHeader>
                <CardTitle className="text-base">Portfolio</CardTitle>
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
                                        Loading portfolio...
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan={8} className="py-8 px-4 text-center text-xs text-destructive">
                                        {error}
                                    </td>
                                </tr>
                            ) : portfolio.length === 0 ? (
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
                                portfolio.map((item) => (
                                    <tr key={item.lender_id} className="border-b border-border hover:bg-muted/50 transition-colors">
                                        <td className="py-3 px-4 text-xs text-foreground">
                                            {item.vault_name}
                                        </td>
                                        <td className="py-3 px-4 text-xs text-foreground font-mono">
                                            {truncateAddress(item.vault_address)}
                                        </td>
                                        <td className="py-3 px-4 text-xs text-foreground font-mono">
                                            {truncateAddress(item.borrower_address)}
                                        </td>
                                        <td className="py-3 px-4 text-xs text-foreground font-semibold">
                                            {formatCurrency(parseFloat(item.amount))}
                                        </td>
                                        <td className="py-3 px-4 text-xs text-foreground">
                                            {formatCurrency(parseFloat(item.current_capacity))} / {formatCurrency(parseFloat(item.max_capacity))}
                                        </td>
                                        <td className="py-3 px-4 text-xs text-foreground">
                                            {formatCapacityPercentage(item.current_capacity, item.max_capacity)}
                                        </td>
                                        <td className="py-3 px-4 text-xs text-foreground">
                                            {formatDate(item.created_at)}
                                        </td>
                                        <td className="py-3 px-4 text-xs text-foreground font-mono">
                                            <a
                                                href={`https://explorer.sepolia.mantle.xyz/tx/${item.tx_hash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-500 hover:text-blue-700 underline"
                                            >
                                                {truncateAddress(item.tx_hash)}
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
