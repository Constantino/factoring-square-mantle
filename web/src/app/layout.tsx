"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import {PrivyClientConfig, PrivyProvider} from '@privy-io/react-auth';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const privyConfig: PrivyClientConfig = {
    // Create embedded wallets for users who don't have a wallet
    embeddedWallets: {
        ethereum: {
            createOnLogin: 'users-without-wallets'
        }
    }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
          <PrivyProvider
              appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
              clientId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
              config={privyConfig}
          >
            {children}
          </PrivyProvider>
      </body>
    </html>
  );
}
