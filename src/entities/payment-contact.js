import { randomUUID } from "node:crypto";
import { left, right } from "../shared/either.js";
import { normalizeLabel } from "../shared/normalize-label.js";

const EVM_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;
const RESERVED_LABELS = new Set([
  "usdc",
  "eurc",
  "erc20",
  "twitter",
  "x",
  "gmail",
  "base",
  "ethereum",
  "arbitrum",
  "optimism",
  "polygon",
  "avalanche",
  "arc",
]);

export class PaymentContact {
  constructor(props) {
    this.id = props.id ?? randomUUID();
    this.userId = props.userId;
    this.label = String(props.label ?? "").trim();
    this.normalizedLabel = props.normalizedLabel ?? normalizeLabel(props.label);
    this.address = props.address;
    this.chainPreference = props.chainPreference ?? null;
    this.createdAt = props.createdAt ? new Date(props.createdAt) : new Date();
    this.updatedAt = props.updatedAt ? new Date(props.updatedAt) : new Date();
  }

  static create(props) {
    const normalizedLabel = normalizeLabel(props.label);
    const error = PaymentContact.#validate({ ...props, normalizedLabel });
    if (error) return left(error);
    return right(new PaymentContact({ ...props, normalizedLabel }));
  }

  static #validate({ userId, label, normalizedLabel, address }) {
    if (!userId) return "User id is required.";
    if (!String(label ?? "").trim()) return "Label is required.";
    if (!normalizedLabel) return "Label is invalid.";
    if (normalizedLabel.length < 2)
      return "Label must have at least 2 characters.";
    if (RESERVED_LABELS.has(normalizedLabel)) return "Label is reserved.";
    if (!EVM_ADDRESS_RE.test(String(address ?? "")))
      return "Address must be a valid EVM address.";
    return null;
  }
}
