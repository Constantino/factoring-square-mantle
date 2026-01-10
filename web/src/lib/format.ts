/**
 * Formats a number as currency in USD
 * @param amount - The amount to format
 * @returns Formatted currency string (e.g., "$1,234.56")
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

/**
 * Formats a date string to a readable format
 * @param dateString - ISO date string
 * @returns Formatted date string (e.g., "Jan 15, 2024")
 */
export function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

/**
 * Formats a decimal rate as a percentage
 * @param rate - Decimal rate (e.g., 0.015 for 1.5%)
 * @returns Formatted percentage string (e.g., "1.50%")
 */
export function formatPercentage(rate: number): string {
    return `${(rate * 100).toFixed(2)}%`;
}

/**
 * Gets the CSS classes for status badge based on status value
 * @param status - The status string
 * @returns CSS classes for the status badge
 */
export function getStatusBadgeClass(status: string): string {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
        case "listed":
            return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
        case "active":
            return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
        case "paid":
            return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
        case "canceled":
            return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
        default:
            return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
}

/**
 * Formats status string to Title Case
 * @param status - The status string (e.g., "listed", "pending_assignment")
 * @returns Formatted status string (e.g., "Listed", "Pending Assignment")
 */
export function formatStatus(status: string): string {
    // Convert snake_case or lowercase to Title Case
    return status
        .split(/[_\s]+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

