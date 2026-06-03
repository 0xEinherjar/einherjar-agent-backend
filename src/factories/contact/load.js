import { MongoDatabase } from "../../database/mongodb.js";
import { PaymentContactRepository } from "../../repositories/contact.js";
import { LoadPaymentContactsService } from "../../services/contact/load.js";

export const LoadPaymentContactsFactory = () => {
  const database = new MongoDatabase();
  const repository = new PaymentContactRepository(database);
  return new LoadPaymentContactsService({
    paymentContactRepository: repository,
  });
};
