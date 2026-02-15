import { z } from "zod";
import { TransferNativeToUsernameTwitterFactory } from "../factory/blockchain/transfer-native-to-username-twitter.js";

export const transferNativeToUsername = {
  name: "transferNativeToUsername",
  description: "Transfers USDC (native token) to a Twitter user defined by their handle (e.g. @username). Use this tool whenever the user wants to send USDC or Native currency to a @handle.",
  parameters: z.object({
    to: z.string().describe("Recipient's username (handle), including the @ prefix (e.g., \"@rodrigo\")."),
    value: z.string().describe("Amount of tokens to be sent, provided as a string."),
  }),
  handle: async ({ to, value }, runtime) => {
    console.log("TransferNativeToUsernameTwitter", to, value);
    const result = await TransferNativeToUsernameTwitterFactory().execute({ id: runtime.context?.twitterAuthorId, to, value });
    console.log("TransferNativeToUsernameTwitterFactory", result.value);
    if (result.isLeft()) throw new Error(result.value.message);
    return JSON.stringify(result.value);
  },
};