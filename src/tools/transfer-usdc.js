import { z } from "zod";
import { TransferStablecoinFactory } from "../factory/blockchain/transfer-stablecoin.js";

export const transferUsdc = {
  name: "transferUsdc",
  description: "Transfers usdc tokens from a platform user's account to a specified Ethereum wallet address.",
  parameters: z.object({
    to: z.string().describe("Ethereum wallet address that will receive the usdc tokens."),
    value: z.string().describe("Amount of tokens to be sent, provided as a string."),
    chain: z.string().optional().default(null).describe("Blockchain network to transfer the usdc tokens."),
  }),
  handle: async ({ to, value, chain }, runtime) => {
    const result = await TransferStablecoinFactory().execute({
      id: runtime.context?.authorId,
      to,
      value,
      chain,
      token: "USDC",
    });
    if (result.isLeft()) throw new Error(result.value.message);
    return JSON.stringify(result.value);
  }
}