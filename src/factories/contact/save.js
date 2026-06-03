import { MongoDatabase } from "../../database/mongodb.js";
import { PaymentContactRepository } from "../../repositories/contact.js";
import { SavePaymentContactService } from "../../services/contact/save.js";

export const SavePaymentContactFactory = () => {
  const database = new MongoDatabase();
  const repository = new PaymentContactRepository(database);
  return new SavePaymentContactService({
    paymentContactRepository: repository,
  });
};
