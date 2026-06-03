import { z } from "zod";
import { TransferStablecoinToUsernameTwitterFactory } from "../factories/transfers/stablecoin-to-username-twitter.js";

export const transferUsdcToUsername = {
  name: "transferUsdcToUsername",
  description: "Transfers USDC (usdc token) to a Twitter user defined by their handle (e.g. @username). Use this tool whenever the user wants to send USDC or token to a @handle.",
  parameters: z.object({
    to: z.string().describe("Recipient's username (handle), including the @ prefix (e.g., \"@rodrigo\")."),
    value: z.string().describe("Amount of tokens to be sent, provided as a string."),
  }),
  handle: async ({ to, value }, runtime) => {
    const result = await TransferStablecoinToUsernameTwitterFactory().execute({
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