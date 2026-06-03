import { left, right } from "../../shared/either.js";

export class LoadUserService {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  async execute(query) {
    const result = await this.userRepository.loadOne(query);
    if (!result) {
      return left({ type: "NOT_FOUND", message: "User not found" });
    }
    return right({
      userId: result.userId,
      address: result.address,
      walletId: result.walletId,
      twitterId: result.twitterId,
      gmailAddress: result.gmailAddress,
    });
  }
}
