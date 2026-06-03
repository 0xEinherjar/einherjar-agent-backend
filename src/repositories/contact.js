import { PaymentContact } from "../entities/payment-contact.js";
import { normalizeLabel } from "../shared/normalize-label.js";

export class PaymentContactRepository {
  constructor(database) {
    this.collection = "payment_contacts";
    this.database = database;
  }

  async create(contact) {
    await this.database.insert(this.collection, {
      id: contact.id,
      userId: contact.userId,
      label: contact.label,
      normalizedLabel: contact.normalizedLabel,
      address: contact.address,
      chainPreference: contact.chainPreference,
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt,
    });
  }

  async load(userId) {
    const contacts = await this.database.find(this.collection, { userId });
    return contacts
      .map((contact) => new PaymentContact(contact))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  async loadOne(query) {
    const contact = await this.database.findOne(this.collection, query);
    if (!contact) return null;
    return new PaymentContact(contact);
  }

  async loadByLabel({ userId, label }) {
    return await this.loadOne({
      userId,
      normalizedLabel: normalizeLabel(label),
    });
  }

  async update(contact) {
    await this.database.update(
      this.collection,
      { id: contact.id, userId: contact.userId },
      {
        label: contact.label,
        normalizedLabel: contact.normalizedLabel,
        address: contact.address,
        chainPreference: contact.chainPreference,
        updatedAt: new Date(),
      },
    );
  }

  async delete({ id, userId }) {
    await this.database.deleteOne(this.collection, { id, userId });
  }
}
