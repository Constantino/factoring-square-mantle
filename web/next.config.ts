import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Configure Turbopack to resolve modules from the web directory
    turbopack: {
        // Set the root directory to the web folder to avoid workspace root detection issues
        root: __dirname
    },
};

export default nextConfig;
