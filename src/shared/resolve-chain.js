export const CHAINS_MAP = {
  ethereum_sepolia: {
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
    canonical: "Arbitrum_Sepolia",
    aliases: [
      "arbitrum",
      "arb",
      "arbitrum sepolia",
    ],
  },
  arc_testnet: {
    canonical: "Arc_Testnet",
    aliases: [
      "arc",
      "arc testnet",
      "arc network",
    ],
  },
  base_sepolia: {
    canonical: "Base_Sepolia",
    aliases: [
      "base",
      "base testnet",
      "base sepolia",
    ],
  },
  optimism_sepolia: {
    canonical: "Optimism_Sepolia",
    aliases: [
      "op",
      "op sepolia",
      "optimism",
      "optimism sepolia",
    ],
  },
  polygon_amoy: {
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
        return chain.canonical;
      }
    }
  }

  return null;
}