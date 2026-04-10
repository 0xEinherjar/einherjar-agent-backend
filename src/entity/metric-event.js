import { left, right } from "../shared/either.js";

const VALID_TYPES = new Set([ "TRANSACTION", "TOKEN_CREATED" ]);
const VALID_TOKENS = new Set(["USDC", "EURC", "ERC20"]);

export default class MetricEvent {
  constructor({ type, token, amount, chain, userId, createdAt }) {
    this.type = type;
    this.token = token ?? null;
    this.amount = amount ?? 0;
    this.chain = chain ?? null;
    this.userId = userId ?? null;
    this.createdAt = createdAt ?? new Date();
  }

  static create(props) {
    const error = MetricEvent.#validate(props);
    if (error) return left(error);
    return right(new MetricEvent(props));
  }

  static #validate({ type, token }) {
    if (!type) return "Metric type is required.";
    if (!VALID_TYPES.has(type)) return `Invalid metric type: ${type}`;
    if (token && !VALID_TOKENS.has(token)) return `Invalid token: ${token}`;
    return null;
  }
}
