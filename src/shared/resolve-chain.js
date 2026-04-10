export const CHAINS_MAP_USDC = {
  ethereum_sepolia: {
    domain: 0,
    token: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    canonical_circle: "ETH-SEPOLIA",
    canonical_bridge: "Ethereum_Sepolia",
    aliases: [
      "ethereum",
      "eth",
      "ethereum sepolia",
      "eth sepolia",
      "sepolia",
    ],
  },
  avalanche_fuji: {
    domain: 1,
    token: "0x5425890298aed601595a70AB815c96711a31Bc65",
    canonical_circle: "AVAX-FUJI",
    canonical_bridge: "Avalanche_Fuji",
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
    domain: 3,
    token: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
    canonical_circle: "ARB-SEPOLIA",
    canonical_bridge: "Arbitrum_Sepolia",
    aliases: [
      "arbitrum",
      "arb",
      "arbitrum sepolia",
    ],
  },
  arc_testnet: {
    domain: 26,
    token: "0x3600000000000000000000000000000000000000",
    canonical_circle: "ARC-TESTNET",
    canonical_bridge: "Arc_Testnet",
    aliases: [
      "arc",
      "arc testnet",
      "arc network",
    ],
  },
  base_sepolia: {
    domain: 6,
    token: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    canonical_circle: "BASE-SEPOLIA",
    canonical_bridge: "Base_Sepolia",
    aliases: [
      "base",
      "base testnet",
      "base sepolia",
    ],
  },
  optimism_sepolia: {
    domain: 2,
    token: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
    canonical_circle: "OP-SEPOLIA",
    canonical_bridge: "Optimism_Sepolia",
    aliases: [
      "op",
      "op sepolia",
      "optimism",
      "optimism sepolia",
    ],
  },
  polygon_amoy: {
    domain: 7,
    token: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582",
    canonical_circle: "MATIC-AMOY",
    canonical_bridge: "Polygon_Amoy_Testnet",
    aliases: [
      "polygon",
      "poly",
      "polygon amoy",
      "poly amoy",
      "polygon testnet",
    ],
  },
};

export const CHAINS_MAP_EURC = {
  arc_testnet: {
    token: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
    canonical_circle: "ARC-TESTNET",
    canonical_bridge: "Arc_Testnet",
    aliases: [
      "arc",
      "arc testnet",
      "arc network",
    ],
  },
  ethereum_sepolia: {
    token: "0x08210F9170F89Ab7658F0B5E3fF39b0E03C594D4",
    canonical_circle: "ETH-SEPOLIA",
    canonical_bridge: "Ethereum_Sepolia",
    aliases: [
      "ethereum",
      "eth",
      "ethereum sepolia",
      "eth sepolia",
      "sepolia",
    ],
  },
  avalanche_fuji: {
    token: "0x5E44db7996c682E92a960b65AC713a54AD815c6B",
    canonical_circle: "AVAX-FUJI",
    canonical_bridge: "Avalanche_Fuji",
    aliases: [
      "avalanche",
      "avax",
      "avalanche fuji",
      "avax fuji",
      "avalanche testnet",
      "avax testnet",
    ],
  },
  base_sepolia: {
    token: "0x808456652fdb597867f38412077A9182bf77359F",
    canonical_circle: "BASE-SEPOLIA",
    canonical_bridge: "Base_Sepolia",
    aliases: [
      "base",
      "base testnet",
      "base sepolia",
    ],
  },
};

export const SUPPORTED_CHAINS = Object.values(CHAINS_MAP_USDC).map(
  (c) => c.canonical_bridge
);

export const SUPPORTED_CHAINS_EURC = Object.values(CHAINS_MAP_EURC).map(
  (c) => c.canonical_bridge
);

function resolveFromMap(chainsMap, input) {
  if (!input) return null;

  const normalizedInput = input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  for (const chain of Object.values(chainsMap)) {
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

export function resolveChain(input) {
  return resolveFromMap(CHAINS_MAP_USDC, input);
}

export function resolveChainWithDefault(input) {
  const chain = resolveChain(input);
  if (chain) return chain;
  return CHAINS_MAP_USDC.arc_testnet;
}

export function resolveChainEurc(input) {
  return resolveFromMap(CHAINS_MAP_EURC, input);
}

export function resolveChainEurcWithDefault(input) {
  const chain = resolveChainEurc(input);
  if (chain) return chain;
  return CHAINS_MAP_EURC.arc_testnet;
}