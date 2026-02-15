import { z } from "zod";
import { TransferNativeFactory } from "../factory/blockchain/transfer-native.js";

export const transferNative = {
  name: "transferNative",
  description: "Transfers native tokens from a platform user's account to a specified Ethereum wallet address.",
  parameters: z.object({
    to: z.string().describe("Ethereum wallet address that will receive the native tokens."),
    value: z.string().describe("Amount of tokens to be sent, provided as a string."),
  }),
  handle: async ({ to, value }, runtime) => {
    const result = await TransferNativeFactory().execute({ id: runtime.context?.twitterAuthorId, to, value });
    if (result.isLeft()) throw new Error(result.value.message);
    return JSON.stringify(result.value);
  }
}