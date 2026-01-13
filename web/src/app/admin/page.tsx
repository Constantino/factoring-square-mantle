"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditScoreGauge } from "@/components/credit-score-gauge";
import { LoansTable } from "@/components/loans-table";
import { LoanStatsPieChart } from "@/components/loan-stats-pie-chart";
import { PlatformPerformanceAreaChart } from "@/components/platform-performance-area-chart";
import { LoanRequestWithVault, LoanStats } from "@/types/loans";
import { formatCurrency } from "@/lib/format";

export default function AdminPage() {
    // Dummy data
    const loanStats: LoanStats = {
        active: 12,
        paid: 8,
        defaulted: 2,
        listed: 5,
    };

    const loanRequests: LoanRequestWithVault[] = [
        {
            id: 1,
            invoice_number: "INV-2024-001",
            invoice_amount: 50000,
            invoice_due_date: "2024-12-31",
            term: 90,
            customer_name: "Acme Corporation",
            monthly_interest_rate: 0.015,
            advance_rate: 0.8,
            max_loan: 40000,
            delivery_completed: true,
            assignment_signed: true,
            not_pledged: true,
            borrower_address: "0x1234567890123456789012345678901234567890",
            created_at: "2024-01-15T10:00:00Z",
            modified_at: "2024-01-15T10:00:00Z",
            status: "active",
            vault_id: 1,
            vault_address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
            vault_name: "Vault 1",
            max_capacity: "40000",
            current_capacity: "35000",
            loan_request_id: 1,
            vault_created_at: "2024-01-15T10:00:00Z",
            vault_modified_at: "2024-01-15T10:00:00Z",
            vault_fund_release_at: "2024-04-15T10:00:00Z",
        },
        {
            id: 2,
            invoice_number: "INV-2024-002",
            invoice_amount: 75000,
            invoice_due_date: "2024-11-30",
            term: 60,
            customer_name: "Tech Solutions Inc",
            monthly_interest_rate: 0.018,
            advance_rate: 0.75,
            max_loan: 56250,
            delivery_completed: true,
            assignment_signed: true,
            not_pledged: true,
            borrower_address: "0x2345678901234567890123456789012345678901",
            created_at: "2024-02-01T10:00:00Z",
            modified_at: "2024-02-01T10:00:00Z",
            status: "listed",
            vault_id: 2,
            vault_address: "0xbcdefabcdefabcdefabcdefabcdefabcdefabcde",
            vault_name: "Vault 2",
            max_capacity: "56250",
            current_capacity: "0",
            loan_request_id: 2,
            vault_created_at: "2024-02-01T10:00:00Z",
            vault_modified_at: "2024-02-01T10:00:00Z",
            vault_fund_release_at: null,
        },
        {
            id: 3,
            invoice_number: "INV-2024-003",
            invoice_amount: 30000,
            invoice_due_date: "2024-10-15",
            term: 45,
            customer_name: "Global Industries",
            monthly_interest_rate: 0.012,
            advance_rate: 0.85,
            max_loan: 25500,
            delivery_completed: true,
            assignment_signed: true,
            not_pledged: true,
            borrower_address: "0x3456789012345678901234567890123456789012",
            created_at: "2024-03-10T10:00:00Z",
            modified_at: "2024-03-10T10:00:00Z",
            status: "paid",
            vault_id: 3,
            vault_address: "0xcdefabcdefabcdefabcdefabcdefabcdefabcdef",
            vault_name: "Vault 3",
            max_capacity: "25500",
            current_capacity: "0",
            loan_request_id: 3,
            vault_created_at: "2024-03-10T10:00:00Z",
            vault_modified_at: "2024-03-10T10:00:00Z",
            vault_fund_release_at: "2024-04-25T10:00:00Z",
        },
    ];

    // Dummy calculations
    const totalDebt = 125000;
    const totalInterest = 8750;
    const totalCapital = 121750;
    const creditScore = 750;

    // Generate dummy monthly data for the past 12 months
    const generateMonthlyData = () => {
        const months = [];
        const baseDate = new Date(2024, 0, 1); // January 2024

        for (let i = 0; i < 12; i++) {
            const date = new Date(baseDate);
            date.setMonth(baseDate.getMonth() + i);

            // Generate realistic growth patterns with some variation
            const monthMultiplier = 1 + (i * 0.08); // 8% growth per month
            const variation = 0.9 + Math.random() * 0.2; // ±10% variation

            months.push({
                month: date.toISOString(),
                collateralUnderManagement: Math.round(500000 * monthMultiplier * variation),
                totalCapitalLoaned: Math.round(400000 * monthMultiplier * variation),
                realizedYield: Math.round(25000 * monthMultiplier * variation),
                unrealizedYield: Math.round(15000 * monthMultiplier * variation),
                delinquentRecovery: Math.round(5000 * monthMultiplier * (0.8 + Math.random() * 0.4)),
                managementFeeIncome: Math.round(12000 * monthMultiplier * variation),
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
                            <div className="space-y-3">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-foreground">
                                        Collateral Under Management
                                    </label>
                                    <div className="px-3 py-1.5 bg-muted rounded-md text-xs text-foreground">
                                        {formatCurrency(0)}
                                    </div>
                                    <label className="text-xs font-medium text-foreground">
                                        Total Capital Loaned
                                    </label>
                                    <div className="px-3 py-1.5 bg-muted rounded-md text-xs text-foreground">
                                        {formatCurrency(0)}
                                    </div>
                                    <label className="text-xs font-medium text-foreground">
                                        Realized yield for lenders
                                    </label>
                                    <div className="px-3 py-1.5 bg-muted rounded-md text-xs text-foreground">
                                        {formatCurrency(0)}
                                    </div>
                                    <label className="text-xs font-medium text-foreground">
                                        Unrealized yield for lenders
                                    </label>
                                    <div className="px-3 py-1.5 bg-muted rounded-md text-xs text-foreground">
                                        {formatCurrency(0)}
                                    </div>
                                    <label className="text-xs font-medium text-foreground">
                                        Delinquent accounts recovery
                                    </label>
                                    <div className="px-3 py-1.5 bg-muted rounded-md text-xs text-foreground">
                                        {formatCurrency(0)}
                                    </div>
                                    <label className="text-xs font-medium text-foreground">
                                        Management fee income
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
                            <CardTitle className="text-base">Platform Performance</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <PlatformPerformanceAreaChart data={monthlyData} />
                        </CardContent>
                    </Card>
                </div>

                {/* Loans Table */}
                <LoansTable
                    loanRequests={loanRequests}
                    isLoading={false}
                    error={null}
                    onView={() => { }}
                    onPay={async () => ""}
                />
            </div>
        </div>
    );
}
