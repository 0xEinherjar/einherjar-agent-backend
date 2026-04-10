import { left, right } from "../../shared/either.js";
import { constants } from "../../shared/constant.js";

export default class Service {
  constructor({ repository }) {
    this.repository = repository;
  }

  async execute(input) {
    try {
      const user = await this.repository.loadOne({ userId: input.id });
      if (!user) return left({ type: "NOT_FOUND", message: "User not found" });
      if (!user.address) return left({ type: "BAD_REQUEST", message: "User does not have an address yet" });

      const response = await fetch("https://api.circle.com/v1/faucet/drips", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${constants.CIRCLE_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          address: user.address,
          blockchain: "ARC-TESTNET",
          native: false,
          usdc: true,
          eurc: true
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        return left({ 
          success: false, 
          type: "BAD_REQUEST", 
          message: errData.message || "Failed to request faucet"
        });
      }

      return right({
        success: true,
        message: "Successfully requested USDC and EURC on ARC-TESTNET. Please wait a few moments for them to arrive."
      });
    } catch (error) {
      return left({ 
        success: false, 
        type: "SERVER_ERROR", 
        message: error.message || String(error)
      });
    }
  }
}

