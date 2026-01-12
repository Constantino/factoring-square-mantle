"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWalletAddress } from "@/hooks/use-wallet-address";
import { useToast } from "@/hooks/use-toast";

export default function LoanRequestPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const { walletAddress, walletsReady, privyReady } = useWalletAddress();
    const [formData, setFormData] = useState({
        term: "",
        invoiceNumber: "",
        invoiceAmount: "",
        invoiceDueDate: "",
        customerName: "",
        deliveryCompleted: false,
    });

    const [confirmations, setConfirmations] = useState({
        notPledged: false,
        authorizeAssignment: false,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        if (type === "checkbox") {
            setFormData((prev) => ({
                ...prev,
                [name]: checked,
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    const handleConfirmationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setConfirmations((prev) => ({
            ...prev,
            [name]: checked,
        }));
    };

    // Format number as currency
    const formatCurrency = (value: string): string => {
        // Remove all non-digit characters except decimal point
        const numericValue = value.replace(/[^\d.]/g, '');

        // Handle empty or invalid input
        if (!numericValue || numericValue === '.') {
            return '';
        }

        // Split into integer and decimal parts
        const parts = numericValue.split('.');
        let integerPart = parts[0] || '';
        const decimalPart = parts[1] || '';

        // Add commas to integer part
        integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

        // Combine with decimal (limit to 2 decimal places)
        const formatted = decimalPart
            ? `${integerPart}.${decimalPart.slice(0, 2)}`
            : integerPart;

        return formatted ? `$${formatted}` : '';
    };

    // Handle invoice amount change with currency formatting
    const handleInvoiceAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;

        // Remove all formatting to get raw numeric value
        const numericValue = value.replace(/[^\d.]/g, '');

        // Update formData with raw numeric value
        setFormData((prev) => ({
            ...prev,
            invoiceAmount: numericValue,
        }));
    };

    const invoiceAmountNum = parseFloat(formData.invoiceAmount) || 0;
    const advanceRate = 0.8;
    const calculatedMaxLoan = Math.min(invoiceAmountNum * advanceRate);
    const maxLoan = formData.invoiceAmount ? `$${calculatedMaxLoan.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$0.00";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitError(null);

        // Validate wallet address
        if (!walletAddress) {
            setSubmitError("Please connect a wallet before submitting");
            setIsSubmitting(false);
            return;
        }

        // Validate confirmations
        if (!confirmations.notPledged || !confirmations.authorizeAssignment) {
            setSubmitError("Please confirm both statements before submitting");
            setIsSubmitting(false);
            return;
        }

        try {
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

            // Calculate values
            const invoiceAmountNum = parseFloat(formData.invoiceAmount) || 0;
            const advanceRate = 0.8;
            const monthlyInterestRate = 0.015;
            const calculatedMaxLoan = Math.min(invoiceAmountNum * advanceRate);

            // Transform form data to API format
            const submissionData = {
                invoice_number: formData.invoiceNumber,
                invoice_amount: invoiceAmountNum,
                invoice_due_date: formData.invoiceDueDate,
                term: parseInt(formData.term, 10),
                customer_name: formData.customerName,
                delivery_completed: formData.deliveryCompleted,
                advance_rate: advanceRate,
                monthly_interest_rate: monthlyInterestRate,
                max_loan: calculatedMaxLoan,
                not_pledged: confirmations.notPledged,
                assignment_signed: confirmations.authorizeAssignment,
                borrower_address: walletAddress,
            };

            const response = await axios.post(`${apiUrl}/loan-requests`, submissionData);

            console.log("Loan request submitted successfully:", response.data);

            // Show success toast
            showToast("Loan request submitted successfully!", "success");

            // Reset form after successful submission
            setFormData({
                term: "",
                invoiceNumber: "",
                invoiceAmount: "",
                invoiceDueDate: "",
                customerName: "",
                deliveryCompleted: false,
            });
            setConfirmations({
                notPledged: false,
                authorizeAssignment: false,
            });

            // Redirect to borrower loans page after a brief delay
            setTimeout(() => {
                router.push("/borrowers/loans");
            }, 1000);
        } catch (error) {
            console.error("Error submitting loan request:", error);
            if (axios.isAxiosError(error)) {
                setSubmitError(
                    error.response?.data?.error ||
                    error.response?.data?.message ||
                    error.message ||
                    "Failed to submit loan request"
                );
            } else {
                setSubmitError("An unexpected error occurred");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full p-8">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-4xl font-bold mb-4 text-foreground">Loan Request</h1>
                <p className="text-lg text-muted-foreground mb-8">Submit a new loan request for invoice factoring</p>

                {/* Show spinner during submission */}
                {isSubmitting ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
                        <p className="text-lg font-medium text-foreground">Submitting loan request...</p>
                        <p className="text-sm text-muted-foreground">Please wait while we process your request</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Invoice Number */}
                    <div className="space-y-2">
                        <label htmlFor="invoiceNumber" className="text-sm font-medium text-foreground">
                            Invoice Number
                        </label>
                        <Input
                            id="invoiceNumber"
                            name="invoiceNumber"
                            type="text"
                            value={formData.invoiceNumber}
                            onChange={handleChange}
                            placeholder="Enter invoice number"
                            required
                        />
                    </div>

                    {/* Invoice Amount */}
                    <div className="space-y-2">
                        <label htmlFor="invoiceAmount" className="text-sm font-medium text-foreground">
                            Invoice Amount
                        </label>
                        <Input
                            id="invoiceAmount"
                            name="invoiceAmount"
                            type="text"
                            value={formatCurrency(formData.invoiceAmount)}
                            onChange={handleInvoiceAmountChange}
                            placeholder="$0.00"
                            required
                        />
                    </div>

                    {/* Invoice Due Date */}
                    <div className="space-y-2">
                        <label htmlFor="invoiceDueDate" className="text-sm font-medium text-foreground">
                            Invoice Due Date
                        </label>
                        <DatePicker
                            id="invoiceDueDate"
                            selected={formData.invoiceDueDate ? new Date(formData.invoiceDueDate) : null}
                            onChange={(date: Date | null) => {
                                if (date) {
                                    setFormData((prev) => ({
                                        ...prev,
                                        invoiceDueDate: date.toISOString().split('T')[0],
                                    }));
                                }
                            }}
                            minDate={new Date()}
                            dateFormat="MM/dd/yyyy"
                            placeholderText="Select due date"
                            className={cn(
                                "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                                "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                                "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
                            )}
                            required
                        />
                    </div>

                    {/* Term */}
                    <div className="space-y-2">
                        <label htmlFor="term" className="text-sm font-medium text-foreground">
                            Term
                        </label>
                        <select
                            id="term"
                            name="term"
                            value={formData.term}
                            onChange={handleChange}
                            className={cn(
                                "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                                "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                                "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
                            )}
                            required
                        >
                            <option value="">Select term</option>
                            <option value="30">30 days</option>
                            <option value="60">60 days</option>
                            <option value="90">90 days</option>
                        </select>
                    </div>

                    {/* Customer Name */}
                    <div className="space-y-2">
                        <label htmlFor="customerName" className="text-sm font-medium text-foreground">
                            Customer Name
                        </label>
                        <Input
                            id="customerName"
                            name="customerName"
                            type="text"
                            value={formData.customerName}
                            onChange={handleChange}
                            placeholder="Enter customer name"
                            required
                        />
                    </div>

                    {/* Delivery Completed */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <input
                                id="deliveryCompleted"
                                name="deliveryCompleted"
                                type="checkbox"
                                checked={formData.deliveryCompleted}
                                onChange={handleChange}
                                className={cn(
                                    "h-4 w-4 rounded border-input text-primary focus:ring-ring focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                )}
                            />
                            <label htmlFor="deliveryCompleted" className="text-sm font-medium text-foreground cursor-pointer">
                                Delivery completed? (Yes)
                            </label>
                        </div>
                    </div>

                    {/* Display Section */}
                    <div className="pt-4 border-t border-border space-y-4">
                        <h2 className="text-lg font-semibold text-foreground">Loan Details</h2>

                        {/* Invoice Amount Display */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                                Invoice Amount
                            </label>
                            <div className="px-3 py-2 bg-muted rounded-md text-sm text-foreground">
                                {formData.invoiceAmount
                                    ? `$${parseFloat(formData.invoiceAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                    : "$0.00"}
                            </div>
                        </div>

                        {/* Advance Rate Display */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                                Advance Rate
                            </label>
                            <div className="px-3 py-2 bg-muted rounded-md text-sm text-foreground">
                                80%
                            </div>
                        </div>

                        {/* Monthly Interest Rate Display */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                                Monthly Interest Rate
                            </label>
                            <div className="px-3 py-2 bg-muted rounded-md text-sm text-foreground">
                                1.5%
                            </div>
                        </div>

                        {/* Max Loan Display */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                                Max Loan
                            </label>
                            <div className="px-3 py-2 bg-muted rounded-md text-sm text-foreground">
                                {maxLoan}
                            </div>
                        </div>
                    </div>

                    {/* Confirmation Checkboxes */}
                    <div className="pt-4 border-t border-border space-y-4">
                        <h2 className="text-lg font-semibold text-foreground">Confirmations</h2>

                        <div className="space-y-3">
                            <div className="flex items-start gap-2">
                                <input
                                    id="notPledged"
                                    name="notPledged"
                                    type="checkbox"
                                    checked={confirmations.notPledged}
                                    onChange={handleConfirmationChange}
                                    className={cn(
                                        "h-4 w-4 rounded border-input text-primary focus:ring-ring focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-0.5"
                                    )}
                                    required
                                />
                                <label htmlFor="notPledged" className="text-sm text-foreground cursor-pointer">
                                    I confirm this invoice has not been disputed, pledged, factored, or used as collateral elsewhere.
                                </label>
                            </div>

                            <div className="flex items-start gap-2">
                                <input
                                    id="authorizeAssignment"
                                    name="authorizeAssignment"
                                    type="checkbox"
                                    checked={confirmations.authorizeAssignment}
                                    onChange={handleConfirmationChange}
                                    className={cn(
                                        "h-4 w-4 rounded border-input text-primary focus:ring-ring focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-0.5"
                                    )}
                                    required
                                />
                                <label htmlFor="authorizeAssignment" className="text-sm text-foreground cursor-pointer">
                                    I authorize the assignment of this receivable for financing purposes.
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Borrower Address Display */}
                    <div className="pt-4 border-t border-border space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            Borrower Address
                        </label>
                        {walletAddress ? (
                            <div className="px-3 py-2 bg-muted rounded-md text-sm text-foreground font-mono break-all">
                                {walletAddress}
                            </div>
                        ) : (
                            <div className="px-3 py-2 bg-muted rounded-md text-sm text-muted-foreground italic">
                                {walletsReady && privyReady
                                    ? "No wallet found. Please connect a wallet."
                                    : "Loading wallet information..."}
                            </div>
                        )}
                    </div>

                    {/* Error Message */}
                    {submitError && (
                        <div className="pt-2 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                            <p className="text-sm text-destructive">{submitError}</p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="pt-4">
                        <Button type="submit" className="w-full" disabled={!walletAddress}>
                            Submit Loan Request
                        </Button>
                    </div>
                </form>
                )}
            </div>
        </div>
    );
}

