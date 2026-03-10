export const CHAINS_MAP = {
  ethereum_sepolia: {
    token: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    canonical_viem: "sepolia",
    canonical: "Ethereum_Sepolia",
    aliases: [
      "ethereum",
      "eth",
      "ethereum sepolia",
      "eth sepolia",
      "sepolia",
    ],
  },
  avalanche_fuji: {
    token: "0x5425890298aed601595a70AB815c96711a31Bc65",
    canonical_viem: "avalancheFuji",
    canonical: "Avalanche_Fuji",
    aliases: [
      "avalanche",
      "avax",
      "avalanche fuji",
      "avax fuji",
      "avalanche testnet",
      "avax testnet",
    ],
  },
  arbitrum_sepolia: {
    token: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
    canonical_viem: "arbitrumSepolia",
    canonical: "Arbitrum_Sepolia",
    aliases: [
      "arbitrum",
      "arb",
      "arbitrum sepolia",
    ],
  },
  arc_testnet: {
    token: "0x3600000000000000000000000000000000000000",
    canonical_viem: "arcTestnet",
    canonical: "Arc_Testnet",
    aliases: [
      "arc",
      "arc testnet",
      "arc network",
    ],
  },
  base_sepolia: {
    token: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    canonical_viem: "baseSepolia",
    canonical: "Base_Sepolia",
    aliases: [
      "base",
      "base testnet",
      "base sepolia",
    ],
  },
  optimism_sepolia: {
    token: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
    canonical_viem: "optimismSepolia",
    canonical: "Optimism_Sepolia",
    aliases: [
      "op",
      "op sepolia",
      "optimism",
      "optimism sepolia",
    ],
  },
  polygon_amoy: {
    token: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582",
    canonical_viem: "polygonAmoy",
    canonical: "Polygon_Amoy_Testnet",
    aliases: [
      "polygon",
      "poly",
      "polygon amoy",
      "poly amoy",
      "polygon testnet",
    ],
  },
};

export const SUPPORTED_CHAINS = Object.values(CHAINS_MAP).map(
  (c) => c.canonical
);

export function resolveChain(input) {
  if (!input) return null;

  const normalizedInput = input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  for (const chain of Object.values(CHAINS_MAP)) {
    for (const alias of chain.aliases) {
      const normalizedAlias = alias
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      if (normalizedInput.includes(normalizedAlias)) {
        return chain;
      }
    }
  }

  return null;
}

export function resolveChainWithDefault(input) {
  const chain = resolveChain(input);
  if (chain) return chain;
  return CHAINS_MAP.arc_testnet;
}