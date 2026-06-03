import { MongoDatabase } from "../../database/mongodb.js";
import { PaymentContactRepository } from "../../repositories/contact.js";
import { DeletePaymentContactService } from "../../services/contact/delete.js";

export const DeletePaymentContactFactory = () => {
  const database = new MongoDatabase();
  const repository = new PaymentContactRepository(database);
  return new DeletePaymentContactService({
    paymentContactRepository: repository,
  });
};
