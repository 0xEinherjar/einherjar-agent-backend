import { left, right } from "../shared/either.js";

export default class User {
  constructor({ userId, walletId, address, twitterId, userWalletId }) {
    this.twitterId = twitterId;
    this.walletId = walletId;
    this.address = address;
    this.userId = userId ?? null;
    this.userWalletId = userWalletId ?? null;
  }

  static create(props) {
    const error = User.#validateProps(props);
    if (error) return left(error);
    return right(new User(props));
  }

  static #validateProps({ walletId, address, twitterId }) {
    if (!walletId) return "Wallet Id is required.";
    if (!address) return "Address is required.";
    if (!twitterId) return "Twitter Id is required.";
    return null;
  }
}
