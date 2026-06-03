import { right } from "../../shared/either.js";

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

export class LoadPaymentContactsService {
  constructor({ paymentContactRepository }) {
    this.paymentContactRepository = paymentContactRepository;
  }

  async execute(input) {
    const contacts = await this.paymentContactRepository.load(input.userId);
    return right({ contacts: contacts.map(serialize) });
  }
}