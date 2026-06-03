import { PaymentContact } from "../../entities/payment-contact.js";
import { left, right } from "../../shared/either.js";

function serialize(contact) {
  return {
    id: contact.id,
    label: contact.label,
    address: contact.address,
    chainPreference: contact.chainPreference,
    createdAt: contact.createdAt,
    updatedAt: contact.updatedAt,
  };
}

export class SavePaymentContactService {
  constructor({ paymentContactRepository }) {
    this.paymentContactRepository = paymentContactRepository;
  }

  async execute(input) {
    const created = PaymentContact.create({
      userId: input.userId,
      label: input.label,
      address: input.address,
      chainPreference: input.chainPreference,
    });
    if (created.isLeft())
      return left({ type: "BAD_REQUEST", message: created.value });

    const existing = await this.paymentContactRepository.loadByLabel({
      userId: input.userId,
      label: input.label,
    });
    if (existing) {
      return left({
        type: "CONFLICT",
        message: "A contact with this label already exists.",
      });
    }

    await this.paymentContactRepository.create(created.value);
    return right(serialize(created.value));
  }
}
