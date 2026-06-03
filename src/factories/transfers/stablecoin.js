import { MongoDatabase } from "../../database/mongodb.js";
import { PaymentContactRepository } from "../../repositories/contact.js";
import { UserRepository } from "../../repositories/user.js";
import { StablecoinService } from "../../services/transfers/stablecoin.js";

export const TransferStablecoinFactory = () => {
  const database = new MongoDatabase();
  const userRepository = new UserRepository(database);
  const paymentContactRepository = new PaymentContactRepository(database);
  return new StablecoinService({ userRepository, paymentContactRepository });
};
