"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWalletAddress } from "@/hooks/use-wallet-address";

export default function BorrowerKYBPage() {
    const { walletAddress, walletsReady, privyReady } = useWalletAddress();
    const [formData, setFormData] = useState({
        legalBusinessName: "",
        countryOfIncorporation: "",
        businessRegistrationNumber: "",
        businessDescription: "",
        uboFullName: "",
        averageInvoiceAmount: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const submissionData = {
            ...formData,
            walletAddress: walletAddress || null,
        };

        console.log("Form submitted:", submissionData);
        // TODO: Add API call to submit KYB data
    };

    return (
        <div className="w-full p-8">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-4xl font-bold mb-4 text-foreground">Borrower KYB</h1>
                <p className="text-lg text-muted-foreground mb-8">Know Your Business verification page</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Legal Business Name */}
                    <div className="space-y-2">
                        <label htmlFor="legalBusinessName" className="text-sm font-medium text-foreground">
                            Legal Business Name
                        </label>
                        <Input
                            id="legalBusinessName"
                            name="legalBusinessName"
                            type="text"
                            value={formData.legalBusinessName}
                            onChange={handleChange}
                            placeholder="Enter legal business name"
                            required
                        />
                    </div>

                    {/* Country of Incorporation */}
                    <div className="space-y-2">
                        <label htmlFor="countryOfIncorporation" className="text-sm font-medium text-foreground">
                            Country of Incorporation
                        </label>
                        <select
                            id="countryOfIncorporation"
                            name="countryOfIncorporation"
                            value={formData.countryOfIncorporation}
                            onChange={handleChange}
                            className={cn(
                                "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                                "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                                "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
                            )}
                            required
                        >
                            <option value="">Select a country</option>
                            <option value="USA">USA</option>
                            <option value="Mexico">Mexico</option>
                            <option value="Colombia">Colombia</option>
                            <option value="Brazil">Brazil</option>
                            <option value="Chile">Chile</option>
                        </select>
                    </div>

                    {/* Business Registration Number */}
                    <div className="space-y-2">
                        <label htmlFor="businessRegistrationNumber" className="text-sm font-medium text-foreground">
                            Business Registration Number
                        </label>
                        <Input
                            id="businessRegistrationNumber"
                            name="businessRegistrationNumber"
                            type="text"
                            value={formData.businessRegistrationNumber}
                            onChange={handleChange}
                            placeholder="Enter business registration number"
                            required
                        />
                    </div>

                    {/* Business Description */}
                    <div className="space-y-2">
                        <label htmlFor="businessDescription" className="text-sm font-medium text-foreground">
                            Business Description
                        </label>
                        <textarea
                            id="businessDescription"
                            name="businessDescription"
                            value={formData.businessDescription}
                            onChange={handleChange}
                            placeholder="Describe your business"
                            rows={4}
                            className={cn(
                                "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-y",
                                "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                                "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
                            )}
                            required
                        />
                    </div>

                    {/* UBO Full Name */}
                    <div className="space-y-2">
                        <label htmlFor="uboFullName" className="text-sm font-medium text-foreground">
                            UBO Full Name
                        </label>
                        <Input
                            id="uboFullName"
                            name="uboFullName"
                            type="text"
                            value={formData.uboFullName}
                            onChange={handleChange}
                            placeholder="Enter Ultimate Beneficial Owner full name"
                            required
                        />
                    </div>

                    {/* Average Invoice Amount */}
                    <div className="space-y-2">
                        <label htmlFor="averageInvoiceAmount" className="text-sm font-medium text-foreground">
                            Average Invoice Amount
                        </label>
                        <Input
                            id="averageInvoiceAmount"
                            name="averageInvoiceAmount"
                            type="number"
                            value={formData.averageInvoiceAmount}
                            onChange={handleChange}
                            placeholder="Enter average invoice amount"
                            min="0"
                            step="0.01"
                            required
                        />
                    </div>

                    {/* Wallet Address Display */}
                    <div className="pt-2 space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            Connected Wallet Address
                        </label>
                        {walletAddress ? (
                            <p className="text-sm text-muted-foreground font-mono break-all">
                                {walletAddress}
                            </p>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">
                                {walletsReady && privyReady
                                    ? "No wallet found. Please connect a wallet."
                                    : "Loading wallet information..."}
                            </p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4">
                        <Button type="submit" className="w-full">
                            Submit KYB Information
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
