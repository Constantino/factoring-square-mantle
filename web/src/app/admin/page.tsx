"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditScoreGauge } from "@/components/credit-score-gauge";
import { LoansTable } from "@/components/loans-table";
import { LoanStatsPieChart } from "@/components/loan-stats-pie-chart";
import { PlatformPerformanceAreaChart } from "@/components/platform-performance-area-chart";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { LoanRequestWithVault, LoanStats, LoanRequest } from "@/types/loans";
import { LoanRequestStatus } from "@/types/loans/loanRequestStatus";
import { getAllLoanRequestsByStatus } from "@/services/loanService";
import { formatCurrency } from "@/lib/format";
import { useRequestedCountStore } from "@/stores/requestedCountStore";

export default function AdminPage() {
    const router = useRouter();
    const { setRequestedCount } = useRequestedCountStore();
    const [loanRequests, setLoanRequests] = useState<LoanRequestWithVault[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Dummy data for stats (can be replaced with real API call later)
    const loanStats: LoanStats = {
        active: 12,
        paid: 8,
        defaulted: 2,
        listed: 5,
    };

    useEffect(() => {
        fetchLoanRequests();
    }, []);

    const fetchLoanRequests = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Fetch loan requests by status (REQUESTED)
            const data = await getAllLoanRequestsByStatus(LoanRequestStatus.REQUESTED);

            // Update the requested count in the store
            setRequestedCount(data.length);

            // Map LoanRequest[] to LoanRequestWithVault[] with default vault fields
            // since the table expects vault information but getAllLoanRequestsByStatus doesn't return it
            const mappedData: LoanRequestWithVault[] = data.map((loan: LoanRequest) => ({
                ...loan,
                vault_id: 0,
                vault_address: '',
                vault_name: '',
                max_capacity: '0',
                current_capacity: '0',
                loan_request_id: loan.id,
                vault_created_at: '',
                vault_modified_at: '',
                vault_fund_release_at: null,
            }));

            setLoanRequests(mappedData);
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

    const handleView = (requestId: number) => {
        router.push(`/borrowers/loans/${requestId}`);
    };

    // Dummy calculations
    const totalDebt = 125000;
    const totalInterest = 8750;
    const totalCapital = 121750;
    const creditScore = 750;

    // Generate dummy monthly data for the past 12 months
    // Based on realistic values for a healthy factoring company
    const generateMonthlyData = () => {
        const months = [];
        const baseDate = new Date(2024, 0, 1); // January 2024

        // Starting values for a healthy factoring company
        const startingCollateral = 2500000; // $2.5M in collateral
        const advanceRate = 0.8; // 78% advance rate (typical for factoring)
        const monthlyGrowthRate = 0.06; // 6% monthly growth (healthy but sustainable)
        const realizedYieldRate = 0.015; // 1.5% monthly yield (realized)
        const unrealizedYieldRate = 0.014; // 1.4% monthly yield (unrealized)
        const delinquentRate = 0.012; // 1.2% of capital (low delinquency = healthy)

        // Deterministic monthly variation patterns (simulating real business cycles)
        // Values represent multipliers for each month (0-11) to create ups and downs
        const monthlyVariations = [
            0.95,  // Jan: Post-holiday slowdown
            1.02,  // Feb: Recovery
            1.05,  // Mar: Q1 end, strong
            1.03,  // Apr: Slight dip
            1.08,  // May: Strong growth
            1.06,  // Jun: Q2 end, good
            0.98,  // Jul: Summer slowdown
            1.01,  // Aug: Recovery
            1.07,  // Sep: Q3 end, strong
            1.09,  // Oct: Very strong
            1.12,  // Nov: Q4 peak
            1.10,  // Dec: Strong end of year
        ];

        // Delinquent recovery has different pattern (spikes in certain months)
        const delinquentVariations = [
            1.1,   // Jan: Higher after holidays
            0.9,   // Feb: Lower
            0.85,  // Mar: Low
            0.95,  // Apr: Normal
            0.9,   // May: Low
            1.0,   // Jun: Normal
            1.15,  // Jul: Summer spike
            1.2,   // Aug: Higher
            0.95,  // Sep: Lower
            0.9,   // Oct: Low
            0.85,  // Nov: Very low
            1.05,  // Dec: Slight increase
        ];

        for (let i = 0; i < 12; i++) {
            const date = new Date(baseDate);
            date.setMonth(baseDate.getMonth() + i);

            // Base growth factor (compounding monthly growth)
            const baseGrowthFactor = Math.pow(1 + monthlyGrowthRate, i);

            // Apply monthly variation to create realistic ups and downs
            const monthlyVariation = monthlyVariations[i];
            const growthFactor = baseGrowthFactor * monthlyVariation;

            // Calculate collateral (growing with realistic variations)
            const collateral = Math.round(startingCollateral * growthFactor);

            // Capital loaned varies slightly (78-82% of collateral)
            const capitalLoanedVariation = 0.78 + (i % 3) * 0.01; // Slight variation pattern
            const capitalLoaned = Math.round(collateral * capitalLoanedVariation);

            // Realized yield varies by month (1.3% - 1.7% of capital)
            const yieldVariation = 0.87 + (monthlyVariation - 0.95) * 0.5; // Tied to monthly performance
            const realizedYield = Math.round(capitalLoaned * realizedYieldRate * yieldVariation);

            // Unrealized yield follows similar pattern but slightly lower
            const unrealizedYield = Math.round(capitalLoaned * unrealizedYieldRate * yieldVariation * 0.93);

            // Delinquent recovery has its own pattern (spikes in certain months)
            const delinquentVariation = delinquentVariations[i];
            const delinquentRecovery = Math.round(capitalLoaned * delinquentRate * delinquentVariation);

            // Management fees are 10% of realized yield
            const managementFeeIncome = Math.round(realizedYield * 0.10);

            months.push({
                month: date.toISOString(),
                collateralUnderManagement: collateral,
                totalCapitalLoaned: capitalLoaned,
                realizedYield: realizedYield,
                unrealizedYield: unrealizedYield,
                delinquentRecovery: delinquentRecovery,
                managementFeeIncome: managementFeeIncome,
            });
        }

        return months;
    };

    const monthlyData = generateMonthlyData();

    return (
        <div className="w-full p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <div>
                    <h1 className="text-4xl font-bold mb-4 text-foreground">Admin panel</h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Card
                        initial={false}
                        whileHover={undefined}
                    >
                        <CardHeader className="p-4">
                            <CardTitle className="text-base">Loans</CardTitle>
                            <CardDescription className="text-xs text-muted-foreground">
                                Total loans: {loanStats.active + loanStats.paid + loanStats.defaulted + loanStats.listed}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <LoanStatsPieChart stats={loanStats} />
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
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-foreground">
                                        Collateral
                                    </label>
                                    <div className="px-3 py-1.5 bg-muted rounded-md text-xs text-foreground">
                                        {formatCurrency(0)}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-foreground">
                                        Loaned
                                    </label>
                                    <div className="px-3 py-1.5 bg-muted rounded-md text-xs text-foreground">
                                        {formatCurrency(0)}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-foreground">
                                        Realized Yield
                                    </label>
                                    <div className="px-3 py-1.5 bg-muted rounded-md text-xs text-foreground">
                                        {formatCurrency(0)}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-foreground">
                                        Unrealized Yield
                                    </label>
                                    <div className="px-3 py-1.5 bg-muted rounded-md text-xs text-foreground">
                                        {formatCurrency(0)}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-foreground">
                                        Accounts Recovery
                                    </label>
                                    <div className="px-3 py-1.5 bg-muted rounded-md text-xs text-foreground">
                                        {formatCurrency(0)}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-foreground">
                                        Management Income
                                    </label>
                                    <div className="px-3 py-1.5 bg-muted rounded-md text-xs text-foreground">
                                        {formatCurrency(0)}
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
                            <CardTitle className="text-base">Performance</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <PlatformPerformanceAreaChart data={monthlyData} />
                        </CardContent>
                    </Card>
                </div>

                {/* Loans Table */}
                <LoansTable
                    title="Requested Loans"
                    loanRequests={loanRequests}
                    isLoading={isLoading}
                    error={error}
                    onView={handleView}
                    onPay={async () => ""}
                />
            </div>
        </div>
    );
}
