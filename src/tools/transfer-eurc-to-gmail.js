import { z } from "zod";
import { TransferStablecoinToGmailFactory } from "../factories/transfers/stablecoin-to-gmail.js";
import { SUPPORTED_CHAINS_EURC } from "../shared/resolve-chain.js";

export const transferEurcToGmail = {
  name: "transferEurcToGmail",
  description: `Transfers EURC (Euro Coin) to a user defined by their gmail address (e.g. user@gmail.com). Use this tool whenever the user wants to send EURC to a gmail address. EURC is only supported on: ${SUPPORTED_CHAINS_EURC.join(", ")}.`,
  parameters: z.object({
    to: z.string().describe("Recipient's gmail address (e.g., \"user@gmail.com\")."),
    value: z.string().describe("Amount of EURC tokens to be sent, provided as a string."),
  }),
  handle: async ({ to, value }, runtime) => {
    const result = await TransferStablecoinToGmailFactory().execute({
      id: runtime.context?.authorId,
      channel: runtime.context?.channel,
      to,
      value,
      token: "EURC",
    });
    if (result.isLeft()) throw new Error(result.value.message);
    return JSON.stringify(result.value);
  },
};
