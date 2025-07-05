"use client"

import { ConnectButton } from "@rainbow-me/rainbowkit";

export function NavBar() {
  return (
    <nav className="flex items-center justify-between bg-gray-800 px-4 py-3 w-full">
      <span className="text-xl font-bold text-white">SovaBTC</span>
      <ConnectButton />
    </nav>
  );
}
