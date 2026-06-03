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

export class UpdatePaymentContactService {
  constructor({ paymentContactRepository }) {
    this.paymentContactRepository = paymentContactRepository;
  }

  async execute(input) {
    const existing = await this.paymentContactRepository.loadOne({
      id: input.id,
      userId: input.userId,
    });
    if (!existing)
      return left({ type: "NOT_FOUND", message: "Contact not found" });

    const updated = PaymentContact.create({
      id: existing.id,
      userId: input.userId,
      label: input.label ?? existing.label,
      address: input.address ?? existing.address,
      chainPreference: input.chainPreference ?? existing.chainPreference,
      createdAt: existing.createdAt,
    });
    if (updated.isLeft())
      return left({ type: "BAD_REQUEST", message: updated.value });

    const duplicate = await this.paymentContactRepository.loadByLabel({
      userId: input.userId,
      label: updated.value.label,
    });
    if (duplicate && duplicate.id !== existing.id) {
      return left({
        type: "CONFLICT",
        message: "A contact with this label already exists.",
      });
    }

    await this.paymentContactRepository.update(updated.value);
    return right(serialize(updated.value));
  }
}
