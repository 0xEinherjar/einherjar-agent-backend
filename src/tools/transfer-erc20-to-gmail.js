import { z } from "zod";
import { TransferErc20ToGmailFactory } from "../factory/blockchain/transfer-erc20-to-gmail.js";

export const transferERC20TokenToGmail = {
  name: "transferERC20TokenToGmail",
  description: "Transfers ERC20 tokens from a platform user's account to another user identified by their gmail address (e.g., user@gmail.com).",
  parameters: z.object({
    to: z.string().describe("Recipient's gmail address (e.g., \"user@gmail.com\")."),
    value: z.string().describe("Amount of tokens to be sent, provided as a string and expressed in the smallest unit (e.g., wei for ERC20)."),
    token: z.string().describe("Address of the ERC20 token contract to be transferred."),
  }),
  handle: async ({ to, value, token }, runtime) => {
    const result = await TransferErc20ToGmailFactory().execute({
      id: runtime.context?.authorId,
      channel: runtime.context?.channel,
      to,
      value,
      token
    });
    if (result.isLeft()) throw new Error(result.value.message);
    return JSON.stringify(result.value);
  },
};
