import User from "../entity/user.js";

export default class Repository {
  #database;
  #collection = "agent_user";

  constructor(database) {
    this.#database = database;
  }

  async create(user) {    
    await this.#database.insert(
      this.#collection,
      {
        userId: user.userId,
        walletId: user.walletId,
        address: user.address,
        twitterId: user.twitterId,
        userWalletId: user.userWalletId
      }
    );
  }

  async load(query) {
    const users = await this.#database.find(this.#collection, query);
    if (!users.length) return null;
    return users.map((user) => new User({
      userId: user.userId,
      walletId: user.walletId,
      address: user.address,
      twitterId: user.twitterId,
      userWalletId: user.userWalletId
    }));
  }

  async loadOne(query) {
    const user = await this.#database.findOne(this.#collection, query);
    if (!user) return null;
    return new User({
      userId: user.userId,
      walletId: user.walletId,
      address: user.address,
      twitterId: user.twitterId,
      userWalletId: user.userWalletId
    })
  }

  async update(user) {
    await this.#database.update(this.#collection,
      {
        userId: user.userId,
      },
      {
        walletId: user.walletId,
        address: user.address,
        twitterId: user.twitterId,
      }
    );
  }
}