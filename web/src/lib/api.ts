/**
 * Gets the configured API URL with proper formatting
 * By default (production), uses the proxy route to avoid mixed content issues
 * Only uses direct API URL when NEXT_PUBLIC_USE_PROXY is set to 'false'
 * @returns The formatted API URL
 * @throws Error if NEXT_PUBLIC_API_URL is not configured when proxy is disabled
 */
export function getApiUrl(): string {
    const useProxy = process.env.NEXT_PUBLIC_USE_PROXY;

    // Only use direct API URL when explicitly disabled (local development)
    if (useProxy === 'false') {
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

