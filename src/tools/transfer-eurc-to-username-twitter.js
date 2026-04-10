import { z } from "zod";
import { TransferStablecoinToUsernameTwitterFactory } from "../factory/blockchain/transfer-stablecoin-to-username-twitter.js";
import { SUPPORTED_CHAINS_EURC } from "../shared/resolve-chain.js";

export const transferEurcToUsername = {
  name: "transferEurcToUsername",
  description: `Transfers EURC (Euro Coin) to a Twitter user defined by their handle (e.g. @username). Use this tool whenever the user wants to send EURC to a @handle. EURC is only supported on: ${SUPPORTED_CHAINS_EURC.join(", ")}.`,
  parameters: z.object({
    to: z.string().describe("Recipient's username (handle), including the @ prefix (e.g., \"@rodrigo\")."),
    value: z.string().describe("Amount of EURC tokens to be sent, provided as a string."),
  }),
  handle: async ({ to, value }, runtime) => {
    const result = await TransferEurcToUsernameTwitterFactory().execute({
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
