import User from "../../entity/user.js";
import { left, right } from "../../shared/either.js";

export default class Service {
  constructor({ repository, walletProvider }) {
    this.repository = repository;
    this.walletProvider = walletProvider;
  }

  async execute(input) {
    let result = await this.repository.loadOne({ twitterId: input.accountId });
    
    if (result) {      
      if (!result.userId) {
        result.userId = input.userId;
        await this.repository.update(result);
      }
      return right({
        userId: result.userId,
        twitterId: result.twitterId,
        walletId: result.walletId,
        address: result.address,
      });
    }

    const wallet = await this.walletProvider.createWallet(null);
    const created = User.create({
      userId: input.userId,
      twitterId: input.accountId,
      walletId: wallet.id,
      address: wallet.address,
      userWalletId: wallet.userWalletId,
    });    
    if (created.isLeft()) return left({ type: "BAD_REQUEST", message: created.value });
    const user = created.value;
    await this.repository.create(user);
    return right({
      userId: user.userId,
      twitterId: user.twitterId,
      walletId: user.walletId,
      address: user.address,
    });
  }
}