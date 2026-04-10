import { left, right } from "../../shared/either.js";

export function parseBalance(value) {
  const str = String(value ?? "0");
  const [whole, decimal = ""] = str.split(".");
  const decimal6 = (decimal + "000000").slice(0, 6);
  return BigInt((whole || "0") + decimal6);
}

export async function waitForTxCompletion(client, txId) {
  const TIMEOUT_MS = 60 * 1000; // 60 seconds
  const startTime = Date.now();
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  while ((startTime + TIMEOUT_MS) > Date.now()) {
    await sleep(1000); // await 1 second
    const transactionStatusResponse = await client.getTransaction({ id: txId });
    const { state, txHash } = transactionStatusResponse.data.transaction;

    const TERMINAL_STATES = new Set(["COMPLETE", "CONFIRMED", "FAILED", "CANCELLED", "DENIED", "STUCK"]);
    if (TERMINAL_STATES.has(state) && (state == "COMPLETE" || state == "CONFIRMED")) {
      return right(txHash);
    }
    if (TERMINAL_STATES.has(state) && (state != "COMPLETE" && state != "CONFIRMED")) {
      return left(state);
    }
  }
  return left({ success: false, message: "Timeout reached while waiting for transaction completion" });
}