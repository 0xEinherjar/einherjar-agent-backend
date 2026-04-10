import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { constants } from "../../shared/constant.js";
import { waitForTxCompletion, parseBalance } from "./helpers.js";
import { resolveChain } from "../../shared/resolve-chain.js";

export const GATEWAY_WALLET_ADDRESS = "0x0077777d7EBA4688BDeF3E311b846F25870A19B9";
export const GATEWAY_MINTER_ADDRESS = "0x0022222ABE238Cc2C7Bb1f21003F0a260052475B";

export const client = initiateDeveloperControlledWalletsClient({
    apiKey: constants.CIRCLE_API_KEY,
    entitySecret: constants.CIRCLE_ENTITY_SECRET,
});

export default class Service {
  constructor({ repository }) {
    this.repository = repository;
  }

  async execute(input) {
    const user = await this.repository.loadOne({ userId: input.id });
    if (!user) return left({ success: false, type: "NOT_FOUND", message: "User not found" });

    const toChain = resolveChain(input.toChain);
    if (!toChain) return left({ success: false, type: "INVALID_CHAIN", message: "Unsupported or unknown blockchain network" });

    const approveResult = this.approve({
        address: user.address,
        chain: toChain.canonical_circle,
        token: toChain.token,
        value: parseBalance(input.value).toString()
    });
    await waitForTxCompletion(client, approveResult.data?.id);

    const depositResult = this.deposit({
        address: user.address,
        chain: toChain.canonical_circle,
        token: toChain.token,
        value: parseBalance(input.value).toString()
    });
    await waitForTxCompletion(client, depositResult.data?.id);
  }

  async approve(input) {
    return await client.createContractExecutionTransaction({
        walletAddress: input.address,
        blockchain: input.chain,
        contractAddress: input.token,
        abiFunctionSignature: "approve(address,uint256)",
        abiParameters: [
            GATEWAY_WALLET_ADDRESS,
            input.value,
        ],
        fee: { type: "level", config: { feeLevel: "MEDIUM" } },
    });
  }

  async deposit(input) {
    return await client.createContractExecutionTransaction({
        walletAddress: input.address,
        blockchain: input.chain,
        contractAddress: GATEWAY_WALLET_ADDRESS,
        abiFunctionSignature: "deposit(address,uint256)",
        abiParameters: [
            input.token,
            input.value,
        ],
        fee: { type: "level", config: { feeLevel: "MEDIUM" } },
    });
  }
}