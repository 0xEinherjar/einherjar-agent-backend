import { z } from "zod";
import { CrosschainTransferFactory } from "../factory/blockchain/crosschain-transfer.js";
import { SUPPORTED_CHAINS } from "../shared/resolve-chain.js";

export const crosschainTransfer = {
  name: "bridge_usdc",
  description: "Performs a USDC bridge between supported blockchains. Use this when the user asks to transfer, send, or bridge funds between networks.",
  parameters: z.object({
    fromChain: z.string().describe(`Source blockchain (e.g., arc, arbitrum, ethereum sepolia). Supported networks: ${SUPPORTED_CHAINS.join(", ")}`),
    toChain: z.string().describe(`Destination blockchain. Supported networks: ${SUPPORTED_CHAINS.join(", ")}`),
    value: z.string().describe("Amount of USDC to be transferred."),
  }),
  handle: async ({ fromChain, toChain, value }, runtime) => {
    const result = await CrosschainTransferFactory().execute({
      id: runtime.context?.authorId,
      channel: runtime.context?.channel,
      fromChain,
      toChain,
      value
    });
    if (result.isLeft()) throw new Error(result.value.message);
    return JSON.stringify(result.value);
  }
}