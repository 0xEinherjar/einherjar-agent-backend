import { z } from "zod";
import { TransferStablecoinFactory } from "../factories/transfers/stablecoin.js";
import { SUPPORTED_CHAINS_EURC } from "../shared/resolve-chain.js";

export const transferEurc = {
  name: "transferEurc",
  description: `Transfers EURC (Euro Coin) tokens from a platform user's account to a specified Ethereum wallet address or a saved payment contact label. EURC is only supported on: ${SUPPORTED_CHAINS_EURC.join(", ")}.`,
  parameters: z.object({
    to: z.string().describe("Ethereum wallet address or saved payment contact label that will receive the EURC tokens."),
    value: z.string().describe("Amount of EURC tokens to be sent, provided as a string."),
    chain: z.string().optional().default(null).describe(`Blockchain network to transfer the EURC tokens. Supported: ${SUPPORTED_CHAINS_EURC.join(", ")}.`),
  }),
  handle: async ({ to, value, chain }, runtime) => {
    const result = await TransferStablecoinFactory().execute({
      id: runtime.context?.authorId,
      to,
      value,
      chain,
      token: "EURC",
    });
    if (result.isLeft()) throw new Error(result.value.message);
    return JSON.stringify(result.value);
  }
}
