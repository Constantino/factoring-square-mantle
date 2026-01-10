"use client";

import { useState } from "react";
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
        <div className="flex flex-col items-center justify-center py-4">
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
                    const textPoint = getArcPoint(markerAngle, outerRadius + 20);

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
                                y={textPoint.y + 4}
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
                <div className="text-3xl font-bold text-foreground">
                    {score}
                </div>
                <div className="text-lg font-medium mt-1" style={{ color: category.color }}>
                    {category.label}
                </div>
            </div>
        </div>
    );
}

export default function LoanDashboardPage() {
    const { walletAddress, walletsReady, privyReady } = useWalletAddress();
    const [copied, setCopied] = useState(false);
    const creditScore = 725; // Example score - can be made dynamic later

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

    return (
        <div className="w-full p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <h1 className="text-4xl font-bold mb-4 text-foreground">Loan Dashboard</h1>
                    <p className="text-lg text-muted-foreground">
                        View your loan requests and manage your borrowing activity
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card
                        initial={false}
                        whileHover={undefined}
                    >
                        <CardHeader>
                            <CardTitle>Borrower Information</CardTitle>
                            <CardDescription>
                                Your connected wallet address
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                    Borrower Address
                                </label>
                                {walletAddress ? (
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 px-3 py-2 bg-muted rounded-md text-sm text-foreground font-mono break-all">
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
                                    <div className="px-3 py-2 bg-muted rounded-md text-sm text-muted-foreground italic">
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
                        <CardHeader>
                            <CardTitle>Balances</CardTitle>
                            <CardDescription>
                                Your account balances
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">
                                        USDC Balance
                                    </label>
                                    <div className="px-3 py-2 bg-muted rounded-md text-sm text-foreground">
                                        $0.00
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">
                                        Debt
                                    </label>
                                    <div className="px-3 py-2 bg-muted rounded-md text-sm text-foreground">
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
                        <CardHeader>
                            <CardTitle>Credit Score</CardTitle>
                            <CardDescription>
                                Your current credit rating
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CreditScoreGauge score={creditScore} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

