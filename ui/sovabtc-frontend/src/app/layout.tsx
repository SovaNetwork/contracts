import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "../components/providers/web3-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SovaBTC - Bitcoin meets composability",
  description: "Wrap your Bitcoin into SovaBTC and unlock DeFi opportunities",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}
