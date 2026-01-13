"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, Copy, Check } from "lucide-react";
import { LoanRequestDetail } from "@/types/loans";
import { getLoanRequestDetail } from "@/services/loanService";

export default function LoanRequestDetailPage() {
    const params = useParams();
    const router = useRouter();
    const loanId = params.id as string;
    
    const [loanDetail, setLoanDetail] = useState<LoanRequestDetail | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

    useEffect(() => {
        if (loanId) {
            fetchLoanDetail();
        }
    }, [loanId]);

    const fetchLoanDetail = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const data = await getLoanRequestDetail(parseInt(loanId));
            setLoanDetail(data);
        } catch (err) {
            console.error("Error fetching loan details:", err);
            if (axios.isAxiosError(err)) {
                setError(
                    err.response?.data?.error ||
                    err.response?.data?.message ||
                    err.message ||
                    "Failed to fetch loan details"
                );
            } else {
                setError(err instanceof Error ? err.message : "An unexpected error occurred");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = async (text: string, identifier: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedAddress(identifier);
            setTimeout(() => setCopiedAddress(null), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    };

    const formatCurrency = (amount: number | string) => {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num);
    };

    const shortenAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            LISTED: "bg-blue-100 text-blue-800",
            ACTIVE: "bg-green-100 text-green-800",
            PAID: "bg-gray-100 text-gray-800",
            CANCELED: "bg-red-100 text-red-800",
            DEFAULTED: "bg-red-100 text-red-800"
        };
        return colors[status] || "bg-gray-100 text-gray-800";
    };

    if (isLoading) {
        return (
            <div className="w-full p-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center py-12">
                        <p className="text-sm text-muted-foreground">Loading loan details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full p-6">
                <div className="max-w-6xl mx-auto">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.back()}
                        className="mb-4"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <div className="text-center py-12">
                        <p className="text-sm text-red-500 mb-4">{error}</p>
                        <Button size="sm" onClick={fetchLoanDetail}>Try Again</Button>
                    </div>
                </div>
            </div>
        );
    }

    if (!loanDetail) {
        return null;
    }

    return (
        <div className="w-full p-6">
            <div className="max-w-6xl mx-auto space-y-4">
                {/* Header with back button and status */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Loans
                        </Button>
                        <h1 className="text-3xl font-bold text-foreground">
                            Loan Request Details
                        </h1>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(loanDetail.status)}`}>
                        {loanDetail.status}
                    </div>
                </div>

                {/* Loan Overview - Compact Grid */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Loan Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3">
                            <div>
                                <label className="text-xs text-muted-foreground">Invoice Number</label>
                                <p className="text-sm font-semibold">{loanDetail.invoice_number}</p>
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground">Customer Name</label>
                                <p className="text-sm font-semibold">{loanDetail.customer_name}</p>
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground">Invoice Amount</label>
                                <p className="text-sm font-semibold">{formatCurrency(loanDetail.invoice_amount)}</p>
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground">Max Loan</label>
                                <p className="text-sm font-semibold">{formatCurrency(loanDetail.max_loan)}</p>
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground">Invoice Due Date</label>
                                <p className="text-sm font-semibold">{formatDate(loanDetail.invoice_due_date)}</p>
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground">Term (Days)</label>
                                <p className="text-sm font-semibold">{loanDetail.term}</p>
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground">Monthly Interest Rate</label>
                                <p className="text-sm font-semibold">{(loanDetail.monthly_interest_rate * 100).toFixed(2)}%</p>
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground">Advance Rate</label>
                                <p className="text-sm font-semibold">{(loanDetail.advance_rate * 100).toFixed(2)}%</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Financial Summary - Horizontal */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Financial Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-6">
                            <div>
                                <label className="text-xs text-muted-foreground">Total Funded</label>
                                <p className="text-xl font-bold text-green-600">{formatCurrency(loanDetail.total_funded)}</p>
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground">Total Repaid</label>
                                <p className="text-xl font-bold text-blue-600">{formatCurrency(loanDetail.total_repaid)}</p>
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground">Outstanding Balance</label>
                                <p className="text-xl font-bold text-orange-600">{formatCurrency(loanDetail.outstanding_balance)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Vaults Section */}
                {loanDetail.vaults && loanDetail.vaults.length > 0 ? (
                    loanDetail.vaults.map((vault) => (
                        <div key={vault.vault_id} className="space-y-4">
                            {/* Vault Information - Compact */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg">Vault Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {/* Vault Address */}
                                    <div>
                                        <label className="text-xs text-muted-foreground">Vault Address</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <code className="flex-1 px-2 py-1 bg-muted rounded text-xs font-mono">
                                                {vault.vault_address}
                                            </code>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-7 w-7 p-0"
                                                onClick={() => handleCopy(vault.vault_address, `vault-${vault.vault_id}`)}
                                            >
                                                {copiedAddress === `vault-${vault.vault_id}` ? (
                                                    <Check className="h-3 w-3" />
                                                ) : (
                                                    <Copy className="h-3 w-3" />
                                                )}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-7 w-7 p-0"
                                                onClick={() => window.open(
                                                    `https://sepolia.mantlescan.xyz/address/${vault.vault_address}`,
                                                    "_blank"
                                                )}
                                            >
                                                <ExternalLink className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Vault Details Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3">
                                        <div>
                                            <label className="text-xs text-muted-foreground">Vault Name</label>
                                            <p className="text-sm font-semibold">{vault.vault_name}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted-foreground">Status</label>
                                            <p className="text-sm font-semibold">{vault.status}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted-foreground">Max Capacity</label>
                                            <p className="text-sm font-semibold">{formatCurrency(vault.max_capacity)}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted-foreground">Current Capacity</label>
                                            <p className="text-sm font-semibold">{formatCurrency(vault.current_capacity)}</p>
                                        </div>
                                        {vault.funded_at && (
                                            <div>
                                                <label className="text-xs text-muted-foreground">Funded At</label>
                                                <p className="text-sm font-semibold">{formatDate(vault.funded_at)}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Fund Release Transaction */}
                                    {vault.fund_release_tx_hash && (
                                        <div>
                                            <label className="text-xs text-muted-foreground">Fund Release Transaction</label>
                                            <div className="flex items-center gap-2 mt-1">
                                                <code className="flex-1 px-2 py-1 bg-muted rounded text-xs font-mono">
                                                    {vault.fund_release_tx_hash}
                                                </code>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 w-7 p-0"
                                                    onClick={() => window.open(
                                                        `https://sepolia.mantlescan.xyz/tx/${vault.fund_release_tx_hash}`,
                                                        "_blank"
                                                    )}
                                                >
                                                    <ExternalLink className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Lenders Table - Compact */}
                            {vault.lenders && vault.lenders.length > 0 && (
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg">Lenders ({vault.lenders.length})</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b text-xs">
                                                        <th className="text-left py-2 px-3 font-medium">Lender Address</th>
                                                        <th className="text-right py-2 px-3 font-medium">Amount</th>
                                                        <th className="text-left py-2 px-3 font-medium">Transaction</th>
                                                        <th className="text-right py-2 px-3 font-medium">Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {vault.lenders.map((lender) => (
                                                        <tr key={lender.lender_id} className="border-b hover:bg-muted/50">
                                                            <td className="py-2 px-3">
                                                                <div className="flex items-center gap-2">
                                                                    <code className="text-xs font-mono">
                                                                        {shortenAddress(lender.lender_address)}
                                                                    </code>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-5 w-5 p-0"
                                                                        onClick={() => handleCopy(lender.lender_address, `lender-${lender.lender_id}`)}
                                                                    >
                                                                        {copiedAddress === `lender-${lender.lender_id}` ? (
                                                                            <Check className="h-3 w-3" />
                                                                        ) : (
                                                                            <Copy className="h-3 w-3" />
                                                                        )}
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                            <td className="py-2 px-3 text-right font-semibold">
                                                                {formatCurrency(lender.amount)}
                                                            </td>
                                                            <td className="py-2 px-3">
                                                                <Button
                                                                    variant="link"
                                                                    className="h-auto p-0 text-xs font-mono"
                                                                    onClick={() => window.open(
                                                                        `https://sepolia.mantlescan.xyz/tx/${lender.tx_hash}`,
                                                                        "_blank"
                                                                    )}
                                                                >
                                                                    {shortenAddress(lender.tx_hash)}
                                                                    <ExternalLink className="ml-1 h-3 w-3" />
                                                                </Button>
                                                            </td>
                                                            <td className="py-2 px-3 text-right text-xs text-muted-foreground">
                                                                {formatDate(lender.created_at)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Repayments Table - Compact */}
                            {vault.repayments && vault.repayments.length > 0 && (
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg">Repayment History ({vault.repayments.length})</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b text-xs">
                                                        <th className="text-left py-2 px-3 font-medium">ID</th>
                                                        <th className="text-right py-2 px-3 font-medium">Amount</th>
                                                        <th className="text-left py-2 px-3 font-medium">Transaction</th>
                                                        <th className="text-right py-2 px-3 font-medium">Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {vault.repayments.map((repayment) => (
                                                        <tr key={repayment.repayment_id} className="border-b hover:bg-muted/50">
                                                            <td className="py-2 px-3 font-mono text-xs">
                                                                #{repayment.repayment_id}
                                                            </td>
                                                            <td className="py-2 px-3 text-right font-semibold">
                                                                {formatCurrency(repayment.amount)}
                                                            </td>
                                                            <td className="py-2 px-3">
                                                                <Button
                                                                    variant="link"
                                                                    className="h-auto p-0 text-xs font-mono"
                                                                    onClick={() => window.open(
                                                                        `https://sepolia.mantlescan.xyz/tx/${repayment.tx_hash}`,
                                                                        "_blank"
                                                                    )}
                                                                >
                                                                    {shortenAddress(repayment.tx_hash)}
                                                                    <ExternalLink className="ml-1 h-3 w-3" />
                                                                </Button>
                                                            </td>
                                                            <td className="py-2 px-3 text-right text-xs text-muted-foreground">
                                                                {formatDate(repayment.created_at)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    ))
                ) : (
                    <Card>
                        <CardContent className="py-8">
                            <p className="text-center text-sm text-muted-foreground">
                                No vaults associated with this loan request.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
