"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LenderPortfolio } from "@/types/vault";
import { formatCurrency, formatDate, truncateAddress, formatCapacityPercentage } from "@/lib/format";

interface PortfolioTableProps {
    portfolio: LenderPortfolio[];
    isLoading: boolean;
    error: string | null;
    onRedeem?: (vaultAddress: string, investedAmount: number) => void;
}

export function PortfolioTable({
    portfolio,
    isLoading,
    error,
    onRedeem,
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
                                    Status
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-foreground">
                                    Date
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-foreground">
                                    Transaction
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-foreground">
                                    Actions
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
                                        <td className="py-3 px-4 text-xs">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                item.status === 'REDEEMED'
                                                    ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20'
                                                    : item.status === 'REPAID' 
                                                    ? 'bg-green-500/10 text-green-600 border border-green-500/20'
                                                    : item.status === 'RELEASED'
                                                    ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                                                    : item.status === 'FUNDED'
                                                    ? 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20'
                                                    : 'bg-gray-500/10 text-gray-600 border border-gray-500/20'
                                            }`}>
                                                {item.status}
                                            </span>
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
                                        <td className="py-3 px-4 text-xs">
                                            {item.status === 'REPAID' && onRedeem ? (
                                                <Button
                                                    size="sm"
                                                    onClick={() => onRedeem(item.vault_address, parseFloat(item.amount))}
                                                    className="h-7 px-3 text-xs"
                                                >
                                                    Redeem
                                                </Button>
                                            ) : item.status === 'REDEEMED' ? (
                                                <span className="text-xs text-muted-foreground">Completed</span>
                                            ) : null}
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
