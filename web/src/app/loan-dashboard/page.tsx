"use client";

import { useState } from "react";
import { useWalletAddress } from "@/hooks/use-wallet-address";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

export default function LoanDashboardPage() {
    const { walletAddress, walletsReady, privyReady } = useWalletAddress();
    const [copied, setCopied] = useState(false);

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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                </div>
            </div>
        </div>
    );
}

