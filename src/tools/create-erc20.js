import { z } from "zod";
import { CreateErc20Factory } from "../factories/blockchain/create-erc20.js";

export const createERC20Token = {
  name: "createERC20Token",
  description: "Creates a new ERC20 token on the blockchain for a platform user's account.",
  parameters: z.object({
    name: z.string().describe("Full name of the token (e.g., MyToken)."),
    symbol: z.string().describe("Token symbol, usually 3–5 characters long (e.g., MYT)."),
    supply: z.number().default(1000000000).describe("Total number of tokens to be minted, expressed in whole units before applying decimals."),
  }),
  handle: async ({ name, symbol, supply }, runtime) => {
    const result = await CreateErc20Factory().execute({
      id: runtime.context?.authorId,
      channel: runtime.context?.channel,
      name,
      symbol,
      supply
    });
    if (result.isLeft()) throw new Error(result.value.message);
    return JSON.stringify(result.value);
  }
}