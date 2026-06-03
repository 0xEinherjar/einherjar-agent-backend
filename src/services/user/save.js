import { User } from "../../entities/user.js";
import { left, right } from "../../shared/either.js";

export class SaveUserService {
  constructor({ repository, walletProvider }) {
    this.repository = repository;
    this.walletProvider = walletProvider;
  }

  async execute(input) {
    let result = null;
    if (input.userId) {
      result = await this.repository.loadOne({ userId: input.userId });
    }
    if (!result) {
      if (input.providerId === "twitter") {
        result = await this.repository.loadOne({ twitterId: input.accountId });
      } else if (input.providerId === "google") {
        result = await this.repository.loadOne({ gmailAddress: input.email });
      }
    }

    if (result) {
      let updated = false;
      if (!result.userId && input.userId) {
        result.userId = input.userId;
        updated = true;
      }
      if (input.providerId === "twitter" && !result.twitterId) {
        result.twitterId = input.accountId;
        updated = true;
      }
      if (input.providerId === "google" && !result.gmailAddress) {
        result.gmailAddress = input.email;
        updated = true;
      }

      if (updated) {
        await this.repository.update(result);
      }

      return right({
        userId: result.userId,
        twitterId: result.twitterId,
        walletId: result.walletId,
        address: result.address,
        gmailAddress: result.gmailAddress,
      });
    }

    const wallet = await this.walletProvider.createWallet();
    const created = User.create({
      userId: input.userId,
      walletId: wallet.id,
      address: wallet.address,
      twitterId: input.providerId === "twitter" ? input.accountId : null,
      gmailAddress: input.providerId === "google" ? input.email : null,
    });
    if (created.isLeft()) {
      return left({
        success: false,
        type: "BAD_REQUEST",
        message: created.value,
      });
    }
    const user = created.value;
    await this.repository.create(user);
    return right({
      userId: user.userId,
      twitterId: user.twitterId,
      walletId: user.walletId,
      address: user.address,
      gmailAddress: user.gmailAddress,
    });
  }
}
