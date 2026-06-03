import { MongoDatabase } from "../../database/mongodb.js";
import { PaymentContactRepository } from "../../repositories/contact.js";
import { UserRepository } from "../../repositories/user.js";
import { Erc20Service } from "../../services/transfers/erc20.js";

export const TransferErc20Factory = () => {
  const database = new MongoDatabase();
  const userRepository = new UserRepository(database);
  const paymentContactRepository = new PaymentContactRepository(database);
  return new Erc20Service({
    userRepository,
    paymentContactRepository,
  });
};
