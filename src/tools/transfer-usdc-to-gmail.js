import { z } from "zod";
import { TransferStablecoinToGmailFactory } from "../factory/blockchain/transfer-stablecoin-to-gmail.js";

export const transferUsdcToGmail = {
  name: "transferUsdcToGmail",
  description: "Transfers USDC (usdc token) to a user defined by their gmail address (e.g. user@gmail.com). Use this tool whenever the user wants to send USDC or token to a gmail address.",
  parameters: z.object({
    to: z.string().describe("Recipient's gmail address (e.g., \"user@gmail.com\")."),
    value: z.string().describe("Amount of tokens to be sent, provided as a string."),
  }),
  handle: async ({ to, value }, runtime) => {
    const result = await TransferStablecoinToGmailFactory().execute({
      id: runtime.context?.authorId,
      channel: runtime.context?.channel,
      to,
      value,
      token: "USDC",
    });
    if (result.isLeft()) throw new Error(result.value.message);
    return JSON.stringify(result.value);
  },
};
