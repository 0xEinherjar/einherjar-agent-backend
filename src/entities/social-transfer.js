import { randomUUID } from "node:crypto";
import { left, right } from "../shared/either.js";

const VALID_STATUS = new Set(["PENDING", "WITHDRAWN"]);
const VALID_TOKENS = new Set(["USDC", "EURC", "ERC20"]);

export class SocialTransfer {
  constructor(props) {
    this.id = props.id ?? randomUUID();
    this.senderUserId = props.senderUserId;
    this.senderAddress = props.senderAddress;
    this.recipientTwitterId = props.recipientTwitterId;
    this.recipientUsername = props.recipientUsername;
    this.recipientWalletId = props.recipientWalletId;
    this.recipientAddress = props.recipientAddress;
    this.token = props.token;
    this.tokenAddress = props.tokenAddress ?? null;
    this.tokenDecimals = props.tokenDecimals ?? null;
    this.amount = Number(props.amount);
    this.chain = props.chain;
    this.originalTxHash = props.originalTxHash;
    this.withdrawTxHash = props.withdrawTxHash ?? null;
    this.withdrawTo = props.withdrawTo ?? null;
    this.withdrawDmEventId = props.withdrawDmEventId ?? null;
    this.status = props.status ?? "PENDING";
    this.createdAt = props.createdAt ? new Date(props.createdAt) : new Date();
    this.withdrawnAt = props.withdrawnAt ? new Date(props.withdrawnAt) : null;
  }

  static create(props) {
    const error = SocialTransfer.#validate(props);
    if (error) return left(error);
    return right(new SocialTransfer(props));
  }

  static #validate(props) {
    if (!props.senderUserId) return "Sender user id is required.";
    if (!props.senderAddress) return "Sender address is required.";
    if (!props.recipientTwitterId) return "Recipient Twitter id is required.";
    if (!props.recipientUsername) return "Recipient username is required.";
    if (!props.recipientWalletId) return "Recipient wallet id is required.";
    if (!props.recipientAddress) return "Recipient address is required.";
    if (!VALID_TOKENS.has(props.token)) return `Invalid token: ${props.token}`;
    if (props.token === "ERC20" && !props.tokenAddress) return "Token address is required for ERC20 transfers.";
    if (!Number.isFinite(Number(props.amount)) || Number(props.amount) <= 0) return "Amount must be greater than zero.";
    if (!props.chain) return "Chain is required.";
    if (!props.originalTxHash) return "Original transaction hash is required.";
    if (props.status && !VALID_STATUS.has(props.status)) return `Invalid status: ${props.status}`;
    return null;
  }
}
