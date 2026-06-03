import { left, right } from "../../shared/either.js";

export class DeletePaymentContactService {
  constructor({ paymentContactRepository }) {
    this.paymentContactRepository = paymentContactRepository;
  }

  async execute(input) {
    const existing = await this.paymentContactRepository.loadOne({ id: input.id, userId: input.userId });
    if (!existing) return left({ type: "NOT_FOUND", message: "Contact not found" });
    await this.paymentContactRepository.delete({ id: input.id, userId: input.userId });
    return right({ success: true });
  }
}
