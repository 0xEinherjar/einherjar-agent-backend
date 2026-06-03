import { left, right } from "../shared/either.js";

export class User {
  constructor(props) {
    this.twitterId = props.twitterId ?? null;
    this.twitterHandle = props.twitterHandle ?? null;
    this.gmailAddress = props.gmailAddress ?? null;
    this.walletId = props.walletId;
    this.address = props.address;
    this.userId = props.userId ?? null;
  }

  static create(props) {
    const error = User.#validateProps(props);
    if (error) return left(error);
    return right(new User(props));
  }

  static #validateProps({ walletId, address }) {
    if (!walletId) return "Wallet Id is required.";
    if (!address) return "Address is required.";
    return null;
  }
}
