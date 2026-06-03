import { createCircleWalletsAdapter } from "@circle-fin/adapter-circle-wallets";
import { AppKit } from "@circle-fin/app-kit";
import { constants } from "../../shared/constant.js";
import { left, right } from "../../shared/either.js";

const kit = new AppKit();
const adapter = createCircleWalletsAdapter({
  apiKey: constants.CIRCLE_API_KEY,
  entitySecret: constants.CIRCLE_ENTITY_SECRET,
});

export class SwapService {
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

      const result = await kit.swap({
        from: { adapter, chain: "Arc_Testnet", address: user.address },
        amountIn: String(input.value),
        tokenIn: input.tokenIn,
        tokenOut: input.tokenOut,
        config: { kitKey: constants.CIRCLE_KIT_KEY },
      });
      return right({
        success: true,
        data: {
          tx: result.txHash,
          amountOut: result.amountOut,
          amountIn: result.amountIn,
          explorerUrl: result.explorerUrl,
        },
      });
    } catch (error) {
      const message =
        error?.response?.data?.message ?? error?.message ?? String(error);
      return left({ success: false, type: "SERVER_ERROR", message });
    }
  }
}
