"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, FileText } from "lucide-react";
import { LoanRequestDetail } from "@/types/loans";
import { LoanRequestStatus } from "@/types/loans/loanRequestStatus";
import { getLoanRequestDetail, changeLoanRequestStatus } from "@/services/loanService";
import { useRoleStore } from "@/stores/roleStore";
import { ApproveModal } from "@/components/approve-modal";
import { getApiUrl } from "@/lib/api";
import { CountBadge } from "@/components/count-badge";

export default function LoanRequestDetailPage() {
    const params = useParams();
    const router = useRouter();
    const loanId = params.id as string;
    const { currentRole } = useRoleStore();

    const [loanDetail, setLoanDetail] = useState<LoanRequestDetail | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isChangingStatus, setIsChangingStatus] = useState(false);
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);

    useEffect(() => {
        if (loanId) {
            fetchLoanDetail();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const handleApprove = async () => {
        if (!loanDetail) return;
        setIsApproveModalOpen(true);
    };

    const handleApproveConfirm = async () => {
        if (!loanDetail) return;

        try {
            setIsChangingStatus(true);
            setError(null);

            const apiUrl = getApiUrl();

            // First, tokenize the invoice (mint NFT) - this is imperative before approval
            try {
                await axios.post(
                    `${apiUrl}/nft/tokenize/${loanDetail.id}`
                );
            } catch (tokenizeError) {
                console.error("Error tokenizing invoice:", tokenizeError);
                if (axios.isAxiosError(tokenizeError)) {
                    throw new Error(
                        tokenizeError.response?.data?.error ||
                        tokenizeError.response?.data?.message ||
                        "Failed to tokenize invoice. Cannot proceed with approval."
                    );
                }
                throw new Error("Failed to tokenize invoice. Cannot proceed with approval.");
            }

            // Then, approve the loan request
            const response = await axios.post(
                `${apiUrl}/loan-requests/${loanDetail.id}/approve`
            );

            // Close modal on success
            setIsApproveModalOpen(false);

            // Refresh loan details after approval
            await fetchLoanDetail();
        } catch (err) {
            console.error("Error approving loan:", err);
            if (axios.isAxiosError(err)) {
                setError(
                    err.response?.data?.error ||
                    err.response?.data?.message ||
                    err.message ||
                    "Failed to approve loan request"
                );
            } else {
                setError(err instanceof Error ? err.message : "An unexpected error occurred");
            }
        } finally {
            setIsChangingStatus(false);
        }
    };

    const handleApproveModalClose = () => {
        setIsApproveModalOpen(false);
    };

    const handleReject = async () => {
        if (!loanDetail) return;

        try {
            setIsChangingStatus(true);
            await changeLoanRequestStatus(loanDetail.id, LoanRequestStatus.REJECTED);
            // Refresh loan details after status change
            await fetchLoanDetail();
        } catch (err) {
            console.error("Error rejecting loan:", err);
            if (axios.isAxiosError(err)) {
                setError(
                    err.response?.data?.error ||
                    err.response?.data?.message ||
                    err.message ||
                    "Failed to reject loan"
                );
            } else {
                setError(err instanceof Error ? err.message : "An unexpected error occurred");
            }
        } finally {
            setIsChangingStatus(false);
        }
    };

    if (isLoading) {
        return (
            <div className="w-full p-6">
                <div className="max-w-5xl mx-auto">
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
                <div className="max-w-5xl mx-auto">
                    <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-4">
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

    if (!loanDetail) return null;

    return (
        <div className="w-full p-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <Button variant="ghost" size="sm" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <h1 className="text-2xl font-bold absolute left-1/2 transform -translate-x-1/2">Loan Request Details</h1>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(loanDetail.status)}`}>
                        {loanDetail.status}
                    </div>
                </div>

                {/* Main Content Container */}
                <div className="bg-card rounded-lg border p-6 space-y-6">
                    {/* Admin Action Buttons */}
                    {currentRole === 'Admin' && loanDetail.status === LoanRequestStatus.REQUESTED && (
                        <div className="flex gap-3 justify-end">
                            <Button
                                variant="default"
                                onClick={handleApprove}
                                disabled={isChangingStatus}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                APPROVE
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleReject}
                                disabled={isChangingStatus}
                            >
                                REJECT
                            </Button>
                        </div>
                    )}

                    {/* Loan Overview */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-base font-semibold">Loan Overview</h2>
                            {loanDetail.invoice_file_url && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(loanDetail.invoice_file_url, '_blank')}
                                    className="flex items-center gap-2"
                                >
                                    <FileText className="h-4 w-4" />
                                    View Invoice PDF
                                </Button>
                            )}
                        </div>
                        <div className="grid grid-cols-4 gap-x-8 gap-y-3">
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Invoice Number</p>
                                <p className="text-sm font-medium">{loanDetail.invoice_number}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Customer Name</p>
                                <p className="text-sm font-medium">{loanDetail.customer_name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Invoice Amount</p>
                                <p className="text-sm font-medium">{formatCurrency(loanDetail.invoice_amount)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Max Loan</p>
                                <p className="text-sm font-medium">{formatCurrency(loanDetail.max_loan)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Invoice Due Date</p>
                                <p className="text-sm font-medium">{formatDate(loanDetail.invoice_due_date)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Term (Days)</p>
                                <p className="text-sm font-medium">{loanDetail.term}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Monthly Interest Rate</p>
                                <p className="text-sm font-medium">{(loanDetail.monthly_interest_rate * 100).toFixed(2)}%</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Advance Rate</p>
                                <p className="text-sm font-medium">{(loanDetail.advance_rate * 100).toFixed(2)}%</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Created At</p>
                                <p className="text-sm font-medium">{formatDate(loanDetail.created_at)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div>
                        <h2 className="text-base font-semibold mb-3 text-center">Financial Summary</h2>
                        <div className="grid grid-cols-3 gap-8">
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground mb-1">Total Funded</p>
                                <p className="text-lg font-bold text-green-600">{formatCurrency(loanDetail.total_funded)}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground mb-1">Total Repaid</p>
                                <p className="text-lg font-bold text-blue-600">{formatCurrency(loanDetail.total_repaid)}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground mb-1">Outstanding Balance</p>
                                <p className="text-lg font-bold text-orange-600">{formatCurrency(loanDetail.outstanding_balance)}</p>
                            </div>
                        </div>
                    </div>

                    {loanDetail.vaults && loanDetail.vaults.length > 0 && (
                        <>
                            {/* Vault Information */}
                            {loanDetail.vaults.map((vault) => (
                                <div key={vault.vault_id}>
                                    <h2 className="text-base font-semibold mb-3 text-center">Vault Information</h2>

                                    <div className="space-y-2 mb-4">
                                        <div className="flex">
                                            <p className="text-xs text-muted-foreground w-48">Vault Address</p>
                                            <a
                                                href={`https://sepolia.mantlescan.xyz/address/${vault.vault_address}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs font-mono text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                                            >
                                                {vault.vault_address}
                                                <ExternalLink className="h-3 w-3" />
                                            </a>
                                        </div>
                                        <div className="flex">
                                            <p className="text-xs text-muted-foreground w-48">Vault Name</p>
                                            <p className="text-xs font-medium">{vault.vault_name}</p>
                                        </div>
                                        <div className="flex">
                                            <p className="text-xs text-muted-foreground w-48">Status</p>
                                            <p className="text-xs font-medium">{vault.status}</p>
                                        </div>
                                        <div className="flex">
                                            <p className="text-xs text-muted-foreground w-48">Max Capacity</p>
                                            <p className="text-xs font-medium">{formatCurrency(vault.max_capacity)}</p>
                                        </div>
                                        <div className="flex">
                                            <p className="text-xs text-muted-foreground w-48">Current Capacity</p>
                                            <p className="text-xs font-medium">{formatCurrency(vault.current_capacity)}</p>
                                        </div>
                                        {vault.funded_at && (
                                            <div className="flex">
                                                <p className="text-xs text-muted-foreground w-48">Funded At</p>
                                                <p className="text-xs font-medium">{formatDate(vault.funded_at)}</p>
                                            </div>
                                        )}
                                        {vault.fund_release_tx_hash && (
                                            <div className="flex">
                                                <p className="text-xs text-muted-foreground w-48">Fund Release Transaction</p>
                                                <a
                                                    href={`https://sepolia.mantlescan.xyz/tx/${vault.fund_release_tx_hash}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs font-mono text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                                                >
                                                    {vault.fund_release_tx_hash}
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    {/* Lenders Table */}
                                    {vault.lenders && vault.lenders.length > 0 && (
                                        <div className="mt-6">
                                            <h3 className="text-sm font-semibold mb-3 text-center inline-flex items-center justify-center gap-2 w-full">
                                                <CountBadge count={vault.lenders.length} variant="blue" />
                                                <span>Lenders</span>
                                            </h3>
                                            <div className="border rounded-lg overflow-hidden">
                                                <table className="w-full text-xs">
                                                    <thead>
                                                        <tr className="border-b bg-muted/50 text-xs text-muted-foreground">
                                                            <th className="text-center py-2 px-3 font-medium">Lender Address</th>
                                                            <th className="text-center py-2 px-3 font-medium">Amount</th>
                                                            <th className="text-center py-2 px-3 font-medium">Transaction</th>
                                                            <th className="text-center py-2 px-3 font-medium">Date</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {vault.lenders.map((lender) => (
                                                            <tr key={lender.lender_id} className="border-b last:border-0 hover:bg-muted/30">
                                                                <td className="py-2 px-3 text-center">
                                                                    <a
                                                                        href={`https://sepolia.mantlescan.xyz/address/${lender.lender_address}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-xs font-mono text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                                                                    >
                                                                        {shortenAddress(lender.lender_address)}
                                                                        <ExternalLink className="h-2.5 w-2.5" />
                                                                    </a>
                                                                </td>
                                                                <td className="py-2 px-3 text-center font-medium">
                                                                    {formatCurrency(lender.amount)}
                                                                </td>
                                                                <td className="py-2 px-3 text-center">
                                                                    <a
                                                                        href={`https://sepolia.mantlescan.xyz/tx/${lender.tx_hash}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-xs font-mono text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                                                                    >
                                                                        {shortenAddress(lender.tx_hash)}
                                                                        <ExternalLink className="h-2.5 w-2.5" />
                                                                    </a>
                                                                </td>
                                                                <td className="py-2 px-3 text-center text-muted-foreground">
                                                                    {formatDate(lender.created_at)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* Repayments Table */}
                                    {vault.repayments && vault.repayments.length > 0 && (
                                        <div className="mt-6">
                                            <h3 className="text-sm font-semibold mb-3 text-center inline-flex items-center justify-center gap-2 w-full">
                                                <CountBadge count={vault.repayments.length} variant="gray" />
                                                <span>Repayment History</span>
                                            </h3>
                                            <div className="border rounded-lg overflow-hidden">
                                                <table className="w-full text-xs">
                                                    <thead>
                                                        <tr className="border-b bg-muted/50 text-xs text-muted-foreground">
                                                            <th className="text-center py-2 px-3 font-medium">ID</th>
                                                            <th className="text-center py-2 px-3 font-medium">Amount</th>
                                                            <th className="text-center py-2 px-3 font-medium">Transaction</th>
                                                            <th className="text-center py-2 px-3 font-medium">Date</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {vault.repayments.map((repayment) => (
                                                            <tr key={repayment.repayment_id} className="border-b last:border-0 hover:bg-muted/30">
                                                                <td className="py-2 px-3 text-center font-mono">
                                                                    #{repayment.repayment_id}
                                                                </td>
                                                                <td className="py-2 px-3 text-center font-medium">
                                                                    {formatCurrency(repayment.amount)}
                                                                </td>
                                                                <td className="py-2 px-3 text-center">
                                                                    <a
                                                                        href={`https://sepolia.mantlescan.xyz/tx/${repayment.tx_hash}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-xs font-mono text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                                                                    >
                                                                        {shortenAddress(repayment.tx_hash)}
                                                                        <ExternalLink className="h-2.5 w-2.5" />
                                                                    </a>
                                                                </td>
                                                                <td className="py-2 px-3 text-center text-muted-foreground">
                                                                    {formatDate(repayment.created_at)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* Redemptions Table */}
                                    {vault.lenders && vault.lenders.filter(l => l.status === 'REDEEMED').length > 0 && (
                                        <div className="mt-6">
                                            <h3 className="text-sm font-semibold mb-3 text-center inline-flex items-center justify-center gap-2 w-full">
                                                <CountBadge count={vault.lenders.filter(l => l.status === 'REDEEMED').length} variant="green" />
                                                <span>Redemption History</span>
                                            </h3>
                                            <div className="border rounded-lg overflow-hidden">
                                                <table className="w-full text-xs">
                                                    <thead>
                                                        <tr className="border-b bg-muted/50 text-xs text-muted-foreground">
                                                            <th className="text-center py-2 px-3 font-medium">Lender Address</th>
                                                            <th className="text-center py-2 px-3 font-medium">Invested Amount</th>
                                                            <th className="text-center py-2 px-3 font-medium">Redeemed Amount</th>
                                                            <th className="text-center py-2 px-3 font-medium">Gain</th>
                                                            <th className="text-center py-2 px-3 font-medium">Transaction</th>
                                                            <th className="text-center py-2 px-3 font-medium">Date</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {vault.lenders.filter(l => l.status === 'REDEEMED').map((lender) => {
                                                            const investedAmount = parseFloat(lender.amount);
                                                            const redeemedAmount = parseFloat(lender.redeemed_amount || '0');
                                                            const gain = redeemedAmount - investedAmount;
                                                            return (
                                                                <tr key={lender.lender_id} className="border-b last:border-0 hover:bg-muted/30">
                                                                    <td className="py-2 px-3 text-center">
                                                                        <a
                                                                            href={`https://sepolia.mantlescan.xyz/address/${lender.lender_address}`}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="text-xs font-mono text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                                                                        >
                                                                            {shortenAddress(lender.lender_address)}
                                                                            <ExternalLink className="h-2.5 w-2.5" />
                                                                        </a>
                                                                    </td>
                                                                    <td className="py-2 px-3 text-center font-medium">
                                                                        {formatCurrency(investedAmount)}
                                                                    </td>
                                                                    <td className="py-2 px-3 text-center font-medium">
                                                                        {formatCurrency(redeemedAmount)}
                                                                    </td>
                                                                    <td className="py-2 px-3 text-center font-medium">
                                                                        <span className={gain >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                                            {formatCurrency(gain)}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-2 px-3 text-center">
                                                                        {lender.redemption_tx_hash && (
                                                                            <a
                                                                                href={`https://sepolia.mantlescan.xyz/tx/${lender.redemption_tx_hash}`}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="text-xs font-mono text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                                                                            >
                                                                                {shortenAddress(lender.redemption_tx_hash)}
                                                                                <ExternalLink className="h-2.5 w-2.5" />
                                                                            </a>
                                                                        )}
                                                                    </td>
                                                                    <td className="py-2 px-3 text-center text-muted-foreground">
                                                                        {lender.redeemed_at ? formatDate(lender.redeemed_at) : '-'}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </>
                    )}
                </div>

                {/* Approve Modal */}
                <ApproveModal
                    isOpen={isApproveModalOpen}
                    onClose={handleApproveModalClose}
                    onConfirm={handleApproveConfirm}
                    isChangingStatus={isChangingStatus}
                />
            </div>
        </div>
    );
}
