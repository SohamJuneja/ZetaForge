import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { zetaChainAthensTestnet } from "./chains"; // ✅ your custom chain

// Setup the configuration for wagmi and RainbowKit
const config = getDefaultConfig({
  appName: "ZetaForge",
  projectId: "28c200ed77a9d5cb520070975b597c8e", // your WalletConnect Cloud ID
  chains: [zetaChainAthensTestnet], // ✅ use only Athens testnet
  ssr: false,
});

const queryClient = new QueryClient();

// Create a wrapper component that provides all the necessary contexts
export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
