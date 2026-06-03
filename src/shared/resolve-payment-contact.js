const EVM_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

export async function resolvePaymentContact({ paymentContactRepository, userId, to }) {
  const recipient = String(to ?? "").trim();
  if (!recipient || EVM_ADDRESS_RE.test(recipient)) {
    return { address: recipient, contact: null };
  }

  if (!paymentContactRepository) {
    return { address: recipient, contact: null };
  }

  const contact = await paymentContactRepository.loadByLabel({ userId, label: recipient });
  if (!contact) return { address: recipient, contact: null };
  return { address: contact.address, contact };
}
