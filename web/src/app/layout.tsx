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
              appId="cmjt7jvix01lujx0d8ykuuvpp"
              clientId="client-WY6UHDQE5B2UQiPeskwV7mXv3zR7stVZrGotijXRLP4NR"
              config={privyConfig}
          >
            {children}
          </PrivyProvider>
      </body>
    </html>
  );
}
