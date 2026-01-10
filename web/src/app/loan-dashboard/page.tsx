"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useWalletAddress } from "@/hooks/use-wallet-address";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

interface CreditScoreGaugeProps {
    score: number;
}

function CreditScoreGauge({ score }: CreditScoreGaugeProps) {
    // Score ranges and categories
    const ranges = [
        { min: 300, max: 560, label: "Very Bad", color: "#ef4444" },
        { min: 560, max: 650, label: "Bad", color: "#f97316" },
        { min: 650, max: 700, label: "Fair", color: "#fbbf24" },
        { min: 700, max: 750, label: "Good", color: "#84cc16" },
        { min: 750, max: 850, label: "Excellent", color: "#22c55e" },
    ];

    const getCategory = (score: number) => {
        return ranges.find(r => score >= r.min && score < r.max) || ranges[ranges.length - 1];
    };

    const category = getCategory(score);
    const minScore = 300;
    const maxScore = 850;
    const scoreRange = maxScore - minScore;

    // SVG dimensions
    const width = 300;
    const height = 160;
    const centerX = width / 2;
    const centerY = height; // Center at bottom for upward-opening arc
    const outerRadius = 120;
    const innerRadius = 80;

    // Helper function to convert score to angle (0° = right, 180° = left)
    const scoreToAngle = (scoreValue: number) => {
        const normalized = (scoreValue - minScore) / scoreRange;
        return 180 - (normalized * 180); // 180° (left) to 0° (right)
    };

    // Helper function to get point on arc
    const getArcPoint = (angle: number, radius: number) => {
        const rad = (angle * Math.PI) / 180;
        return {
            x: centerX + Math.cos(rad) * radius,
            y: centerY - Math.sin(rad) * radius, // Negative for upward
        };
    };

    // Create arc segment path
    const createSegmentPath = (startScore: number, endScore: number) => {
        const startAngle = scoreToAngle(startScore);
        const endAngle = scoreToAngle(endScore);

        const innerStart = getArcPoint(startAngle, innerRadius);
        const innerEnd = getArcPoint(endAngle, innerRadius);
        const outerStart = getArcPoint(startAngle, outerRadius);
        const outerEnd = getArcPoint(endAngle, outerRadius);

        const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;

        return `M ${innerStart.x} ${innerStart.y} 
                L ${outerStart.x} ${outerStart.y} 
                A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}
                L ${innerEnd.x} ${innerEnd.y}
                A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}
                Z`;
    };

    // Calculate indicator position
    const indicatorAngle = scoreToAngle(score);
    const indicatorPoint = getArcPoint(indicatorAngle, outerRadius - 20);

    // Score markers
    const markers = [300, 560, 650, 700, 750, 850];

    return (
        <div className="flex flex-col items-center justify-center py-2">
            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
                {/* Colored segments */}
                {ranges.map((range, index) => (
                    <path
                        key={index}
                        d={createSegmentPath(range.min, range.max)}
                        fill={range.color}
                        stroke="white"
                        strokeWidth="2"
                    />
                ))}

                {/* Score markers */}
                {markers.map((markerScore) => {
                    const markerAngle = scoreToAngle(markerScore);
                    const markerPoint = getArcPoint(markerAngle, outerRadius);
                    const textPoint = getArcPoint(markerAngle, outerRadius + 10);

                    return (
                        <g key={markerScore}>
                            <line
                                x1={markerPoint.x}
                                y1={markerPoint.y}
                                x2={textPoint.x}
                                y2={textPoint.y}
                                stroke="#666"
                                strokeWidth="1"
                            />
                            <text
                                x={textPoint.x}
                                y={textPoint.y - 2}
                                textAnchor="middle"
                                fontSize="10"
                                fill="#666"
                                className="font-medium"
                            >
                                {markerScore}
                            </text>
                        </g>
                    );
                })}

                {/* Indicator line */}
                <line
                    x1={centerX}
                    y1={centerY}
                    x2={indicatorPoint.x}
                    y2={indicatorPoint.y}
                    stroke="#3b82f6"
                    strokeWidth="4"
                    strokeLinecap="round"
                />

                {/* Center circle */}
                <circle cx={centerX} cy={centerY} r="8" fill="#3b82f6" />
            </svg>

            {/* Score display */}
            <div className="mt-4 text-center">
                <div className="text-2xl font-bold text-foreground">
                    {score}
                </div>
                <div className="text-sm font-medium mt-1" style={{ color: category.color }}>
                    {category.label}
                </div>
            </div>
        </div>
    );
}

interface LoanRequest {
    id: number;
    invoice_number: string;
    invoice_amount: number;
    invoice_due_date: string;
    term: number;
    customer_name: string;
    monthly_interest_rate: number;
    max_loan: number;
    delivery_completed: boolean;
    assignment_signed: boolean;
    not_pledged: boolean;
    borrower_address: string;
    created_at: string;
    modified_at: string;
}

export default function LoanDashboardPage() {
    const { walletAddress, walletsReady, privyReady } = useWalletAddress();
    const [copied, setCopied] = useState(false);
    const [loanRequests, setLoanRequests] = useState<LoanRequest[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const creditScore = 725; // Example score - can be made dynamic later

    useEffect(() => {
        if (walletAddress) {
            fetchLoanRequests();
        } else {
            setLoanRequests([]);
        }
    }, [walletAddress]);

    const fetchLoanRequests = async () => {
        if (!walletAddress) return;

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

            const response = await axios.get(`${apiUrl}/loan-requests/borrower/${walletAddress}`);
            setLoanRequests(response.data.data || []);
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
                setError("An unexpected error occurred");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = async () => {
        if (!walletAddress) return;

        try {
            await navigator.clipboard.writeText(walletAddress);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatPercentage = (rate: number) => {
        return `${(rate * 100).toFixed(2)}%`;
    };

    const getStatus = (request: LoanRequest) => {
        if (request.delivery_completed && request.assignment_signed) {
            return "Active";
        } else if (request.delivery_completed) {
            return "Pending Assignment";
        } else {
            return "Pending Delivery";
        }
    };

    const handleView = (requestId: number) => {
        // TODO: Implement view functionality
        console.log("View request:", requestId);
    };

    const handleWithdrawRequest = (requestId: number) => {
        // TODO: Implement withdraw request functionality
        console.log("Withdraw request:", requestId);
    };

    const handlePayLoan = (requestId: number) => {
        // TODO: Implement pay loan functionality
        console.log("Pay loan:", requestId);
    };

    return (
        <div className="w-full p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <div>
                    <h1 className="text-4xl font-bold mb-4 text-foreground">Loan Dashboard</h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Card
                        initial={false}
                        whileHover={undefined}
                    >
                        <CardHeader className="p-4">
                            <CardTitle className="text-base">Borrower Information</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-foreground">
                                    Borrower Address
                                </label>
                                {walletAddress ? (
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 px-3 py-1.5 bg-muted rounded-md text-xs text-foreground font-mono break-all">
                                            {walletAddress}
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={handleCopy}
                                            className="shrink-0"
                                        >
                                            {copied ? (
                                                <Check className="h-4 w-4" />
                                            ) : (
                                                <Copy className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="px-3 py-1.5 bg-muted rounded-md text-xs text-muted-foreground italic">
                                        {walletsReady && privyReady
                                            ? "No wallet found. Please connect a wallet."
                                            : "Loading wallet information..."}
                                    </div>
                                )}
                            </div>
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
                                        USDC Balance
                                    </label>
                                    <div className="px-3 py-1.5 bg-muted rounded-md text-xs text-foreground">
                                        $0.00
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-foreground">
                                        Debt
                                    </label>
                                    <div className="px-3 py-1.5 bg-muted rounded-md text-xs text-foreground">
                                        $0.00
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
                            <CardTitle className="text-base">Credit Score</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <CreditScoreGauge score={creditScore} />
                        </CardContent>
                    </Card>
                </div>

                {/* Invoices Table */}
                <Card
                    initial={false}
                    whileHover={undefined}
                >
                    <CardHeader>
                        <CardTitle className="text-base">Invoices & Loans</CardTitle>
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
                                            <td colSpan={9} className="py-8 px-4 text-center text-xs text-muted-foreground">
                                                Loading loan requests...
                                            </td>
                                        </tr>
                                    ) : error ? (
                                        <tr>
                                            <td colSpan={9} className="py-8 px-4 text-center text-xs text-destructive">
                                                {error}
                                            </td>
                                        </tr>
                                    ) : loanRequests.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="py-8 px-4 text-center text-xs text-muted-foreground">
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
                                                    <span className={`px-2 py-1 rounded-full ${getStatus(request) === "Active"
                                                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                                        : getStatus(request) === "Pending Assignment"
                                                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                                            : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                                                        }`}>
                                                        {getStatus(request)}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-xs text-foreground">
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-xs"
                                                            onClick={() => handleView(request.id)}
                                                        >
                                                            View
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-xs"
                                                            onClick={() => handleWithdrawRequest(request.id)}
                                                        >
                                                            Withdraw
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-xs"
                                                            onClick={() => handlePayLoan(request.id)}
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
            </div>
        </div>
    );
}

