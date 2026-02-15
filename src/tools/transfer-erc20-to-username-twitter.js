import { z } from "zod";
import { TransferErc20ToUsernameTwitterFactory } from "../factory/blockchain/transfer-erc20-to-username-twitter.js";

export const transferERC20TokenToUsername = {
  name: "transferERC20TokenToUsername",
  description: "Transfers ERC20 tokens from a platform user's account to another user identified by their @username (e.g., @rodrigo).",
  parameters: z.object({
    to: z.string().describe("Recipient's username (handle), including the @ prefix (e.g., \"@rodrigo\")."),
    value: z.string().describe("Amount of tokens to be sent, provided as a string and expressed in the smallest unit (e.g., wei for ERC20)."),
    token: z.string().describe("Address of the ERC20 token contract to be transferred."),
  }),
  handle: async ({ to, value, token }, runtime) => {
    const result = await TransferErc20ToUsernameTwitterFactory().execute({ id: runtime.context?.twitterAuthorId, to, value, token });
    if (result.isLeft()) throw new Error(result.value.message);
    return JSON.stringify(result.value);
  },
};