import { MongoDatabase } from "../../database/mongodb.js";
import { UserRepository } from "../../repositories/user.js";
import { SocialTransferRepository } from "../../repositories/social-transfer.js";
import { WithdrawSocialTransferByDmService } from "../../services/twitter/withdraw-social-transfer-by-dm.js";

export const WithdrawSocialTransferByDmFactory = () => {
  const database = new MongoDatabase();
  const userRepository = new UserRepository(database);
  const socialTransferRepository = new SocialTransferRepository(database);
  return new WithdrawSocialTransferByDmService({
    userRepository,
    socialTransferRepository,
  });
};
