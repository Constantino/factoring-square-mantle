/**
 * Gets the configured API URL with proper formatting
 * By default (production), uses the proxy route to avoid mixed content issues
 * Only uses direct API URL when NODE_ENV is explicitly set to 'local'
 * @returns The formatted API URL
 * @throws Error if NEXT_PUBLIC_API_URL is not configured in local mode
 */
export function getApiUrl(): string {
    const nodeEnv = process.env.NODE_ENV;

    // Only use direct API URL when explicitly in local mode
    if (nodeEnv === 'local') {
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

        return apiUrl;
    }

    // Default to production mode: use proxy to avoid mixed content (HTTP/HTTPS) issues
    return '/api/proxy';
}

