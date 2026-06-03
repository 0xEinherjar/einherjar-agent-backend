import { z } from "zod";
import { TransferErc20Factory } from "../factories/transfers/erc20.js";

export const transferERC20Token = {
  name: "transferERC20Token",
  description: "Transfers ERC20 tokens from a platform user's account to a specified Ethereum wallet address or a saved payment contact label.",
  parameters: z.object({
    to: z.string().describe("Ethereum wallet address or saved payment contact label that will receive the ERC20 tokens."),
    value: z.string().describe("Amount of tokens to be sent, provided as a string and expressed in the smallest unit (e.g., wei for ERC20)."),
    token: z.string().describe("Address of the ERC20 token contract to be transferred."),
  }),
  handle: async ({ to, value, token }, runtime) => {
    const result = await TransferErc20Factory().execute({
      id: runtime.context?.authorId,
      channel: runtime.context?.channel,
      to,
      value,
      token
    });
    if (result.isLeft()) throw new Error(result.value.message);
    return JSON.stringify(result.value);
  }
}
