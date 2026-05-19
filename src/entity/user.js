import { left, right } from "../shared/either.js";

export default class User {
  constructor({ userId, walletId, address, twitterId, twitterHandle, gmailAddress }) {
    this.twitterId = twitterId ?? null;
    this.twitterHandle = twitterHandle ?? null;
    this.gmailAddress = gmailAddress ?? null;
    this.walletId = walletId;
    this.address = address;
    this.userId = userId ?? null;
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
