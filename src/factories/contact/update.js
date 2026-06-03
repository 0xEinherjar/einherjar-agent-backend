import { MongoDatabase } from "../../database/mongodb.js";
import { PaymentContactRepository } from "../../repositories/contact.js";
import { UpdatePaymentContactService } from "../../services/contact/update.js";

export const UpdatePaymentContactFactory = () => {
  const database = new MongoDatabase();
  const repository = new PaymentContactRepository(database);
  return new UpdatePaymentContactService({
    paymentContactRepository: repository,
  });
};
