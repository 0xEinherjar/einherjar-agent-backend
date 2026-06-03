import { createCircleWalletsAdapter } from "@circle-fin/adapter-circle-wallets";
import { AppKit } from "@circle-fin/app-kit";
import { constants } from "../../shared/constant.js";
import { left, right } from "../../shared/either.js";
import { recordMetric } from "../../shared/record-metric.js";
import { resolveChain } from "../../shared/resolve-chain.js";

const kit = new AppKit();
const adapter = createCircleWalletsAdapter({
  apiKey: constants.CIRCLE_API_KEY,
  entitySecret: constants.CIRCLE_ENTITY_SECRET,
});

export class CrosschainTransferService {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  async execute(input) {
    try {
      const user = await this.userRepository.loadOne({ userId: input.id });
      if (!user) {
        return left({
          success: false,
          type: "NOT_FOUND",
          message: "User not found",
        });
      }

      const fromChain = resolveChain(input.fromChain);
      const toChain = resolveChain(input.toChain);

      if (!fromChain || !toChain) {
        return left({
          success: false,
          type: "INVALID_CHAIN",
          message: "Unsupported or unknown blockchain network",
        });
      }

      const result = await kit.bridge({
        from: {
          adapter,
          chain: fromChain.canonical_bridge,
          address: user.address,
        },
        to: { adapter, chain: toChain.canonical_bridge, address: user.address },
        amount: String(input.value),
        token: "USDC",
      });

      if (result.state === "success") {
        const explorerUrl = result.steps.at(-1)?.explorerUrl ?? "";
        await recordMetric({
          type: "TRANSACTION",
          token: "USDC",
          amount: Number(input.value),
          chain: `${fromChain.canonical_bridge} -> ${toChain.canonical_bridge}`,
          userId: input.id,
        });
        return right({
          success: true,
          message: `Bridge of ${input.value} USDC from ${fromChain.canonical_bridge} to ${toChain.canonical_bridge} completed successfully. ${explorerUrl}`,
        });
      }

      const failedStep = result.steps.find((s) => s.state === "error");
      return left({
        success: false,
        type: "BRIDGE_FAILED",
        message: `Bridge failed on step: ${failedStep?.name ?? "unknown"}`,
      });
    } catch (error) {
      const message =
        error?.response?.data?.message ?? error?.message ?? String(error);
      return left({ success: false, type: "SERVER_ERROR", message });
    }
  }
}
