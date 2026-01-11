"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/copy-button";
import { LoansTableProps } from "@/types/loan";
import { formatCurrency, formatDate, formatPercentage, getStatusBadgeClass, formatStatus, formatWalletAddress } from "@/lib/format";

export function LoansTable({
    loanRequests,
    isLoading,
    error,
    onView,
    onWithdraw,
    onPay,
}: LoansTableProps) {
    return (
        <Card
            initial={false}
            whileHover={undefined}
        >
            <CardHeader>
                <CardTitle className="text-base">Loans</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left py-3 px-4 text-xs font-semibold text-foreground">
                                    Invoice Number
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-foreground">
                                    Amount
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-foreground">
                                    Due Date
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-foreground">
                                    Term
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-foreground">
                                    Customer Name
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-foreground">
                                    Monthly Interest Rate
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-foreground">
                                    Max Loan
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-foreground">
                                    Funding
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-foreground">
                                    Vault Address
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-foreground">
                                    Status
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-foreground">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={11} className="py-8 px-4 text-center text-xs text-muted-foreground">
                                        Loading loan requests...
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan={11} className="py-8 px-4 text-center text-xs text-destructive">
                                        {error}
                                    </td>
                                </tr>
                            ) : loanRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="py-8 px-4 text-center text-xs text-muted-foreground">
                                        No loan requests found
                                    </td>
                                </tr>
                            ) : (
                                loanRequests.map((request) => (
                                    <tr key={request.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                                        <td className="py-3 px-4 text-xs text-foreground font-mono">
                                            {request.invoice_number}
                                        </td>
                                        <td className="py-3 px-4 text-xs text-foreground">
                                            {formatCurrency(request.invoice_amount)}
                                        </td>
                                        <td className="py-3 px-4 text-xs text-foreground">
                                            {formatDate(request.invoice_due_date)}
                                        </td>
                                        <td className="py-3 px-4 text-xs text-foreground">
                                            {request.term} days
                                        </td>
                                        <td className="py-3 px-4 text-xs text-foreground">
                                            {request.customer_name}
                                        </td>
                                        <td className="py-3 px-4 text-xs text-foreground">
                                            {formatPercentage(request.monthly_interest_rate)}
                                        </td>
                                        <td className="py-3 px-4 text-xs text-foreground">
                                            {formatCurrency(request.max_loan)}
                                        </td>
                                        <td className="py-3 px-4 text-xs text-foreground">
                                            {request.current_capacity ? formatCurrency(parseFloat(request.current_capacity)) : "$0.00"}
                                        </td>
                                        <td className="py-3 px-4 text-xs text-foreground">
                                            {request.vault_address ? (
                                                <CopyButton
                                                    textToCopy={request.vault_address}
                                                    displayText={formatWalletAddress(request.vault_address)}
                                                    iconSize={12}
                                                    textSize="xs"
                                                    showText={true}
                                                />
                                            ) : (
                                                <span className="text-muted-foreground">N/A</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-xs text-foreground">
                                            <span className={`px-2 py-1 rounded-full ${getStatusBadgeClass(request.status)}`}>
                                                {formatStatus(request.status)}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-xs text-foreground">
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-xs"
                                                    onClick={() => onView(request.id)}
                                                >
                                                    View
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-xs"
                                                    onClick={() => onWithdraw(request.id)}
                                                >
                                                    Withdraw
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-xs"
                                                    onClick={() => onPay(request.id)}
                                                >
                                                    Pay
                                                </Button>
                                            </div>
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

