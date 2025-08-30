import { defineChain } from "viem";

export const zetaChainAthensTestnet = defineChain({
  id: 7001,
  name: "ZetaChain Testnet",
  network: "zetachain-testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Zeta",
    symbol: "ZETA",
  },
  rpcUrls: {
    default: { http: ["https://zetachain-athens.g.allthatnode.com/archive/evm"] },
    public: { http: ["https://zetachain-athens.g.allthatnode.com/archive/evm"] },
  },
  blockExplorers: {
    default: { name: "Athens Explorer", url: "https://explorer.athens2.zetachain.com" },
  },
  testnet: true,
});
