import { defineChain } from "viem";

const ALCHEMY_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || "";
export const MONAD_RPC_HTTP = ALCHEMY_KEY
  ? `https://monad-testnet.g.alchemy.com/v2/${ALCHEMY_KEY}`
  : "https://testnet-rpc.monad.xyz";
export const MONAD_RPC_WSS = ALCHEMY_KEY
  ? `wss://monad-testnet.g.alchemy.com/v2/${ALCHEMY_KEY}`
  : undefined;

export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: [MONAD_RPC_HTTP] },
  },
  blockExplorers: {
    default: { name: "Monadscan", url: "https://testnet.monadscan.com" },
  },
  testnet: true,
});

export type BaseConfig = {
  targetNetworks: readonly ReturnType<typeof defineChain>[];
  pollingInterval: number;
  alchemyApiKey: string;
  rpcOverrides?: Record<number, string>;
  walletConnectProjectId: string;
  onlyLocalBurnerWallet: boolean;
};

export type ScaffoldConfig = BaseConfig;

export const DEFAULT_ALCHEMY_API_KEY = "cR4WnXePioePZ5fFrnSiR";

const scaffoldConfig = {
  targetNetworks: [monadTestnet],
  pollingInterval: 250,
  alchemyApiKey: ALCHEMY_KEY || DEFAULT_ALCHEMY_API_KEY,
  rpcOverrides: {
    [monadTestnet.id]: MONAD_RPC_HTTP,
  },
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "3a8170812b534d0ff9d794f19a901d64",
  onlyLocalBurnerWallet: false,
} as const satisfies ScaffoldConfig;

export default scaffoldConfig;
