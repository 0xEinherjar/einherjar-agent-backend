import { SocialTransfer } from "../entities/social-transfer.js";

export class SocialTransferRepository {
  constructor(database) {
    this.collection = "social_transfers";
    this.database = database;
  }

  async create(transfer) {
    await this.database.insert(this.collection, {
      id: transfer.id,
      senderUserId: transfer.senderUserId,
      senderAddress: transfer.senderAddress,
      recipientTwitterId: transfer.recipientTwitterId,
      recipientUsername: transfer.recipientUsername,
      recipientWalletId: transfer.recipientWalletId,
      recipientAddress: transfer.recipientAddress,
      token: transfer.token,
      tokenAddress: transfer.tokenAddress,
      tokenDecimals: transfer.tokenDecimals,
      amount: transfer.amount,
      chain: transfer.chain,
      originalTxHash: transfer.originalTxHash,
      withdrawTxHash: transfer.withdrawTxHash,
      withdrawTo: transfer.withdrawTo,
      withdrawDmEventId: transfer.withdrawDmEventId,
      status: transfer.status,
      createdAt: transfer.createdAt,
      withdrawnAt: transfer.withdrawnAt,
    });
  }

  async loadPendingByTwitterId(twitterId) {
    const rows = await this.database.find(this.collection, {
      recipientTwitterId: twitterId,
      status: "PENDING",
    });
    return rows
      .map((row) => new SocialTransfer(row))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async loadPendingTwitterIds() {
    const rows = await this.database.find(this.collection, {
      status: "PENDING",
    });
    return [
      ...new Set(rows.map((row) => row.recipientTwitterId).filter(Boolean)),
    ];
  }

  async markWithdrawn({ id, withdrawTxHash, withdrawTo, withdrawDmEventId }) {
    await this.database.update(
      this.collection,
      { id, status: "PENDING" },
      {
        status: "WITHDRAWN",
        withdrawTxHash,
        withdrawTo,
        withdrawDmEventId,
        withdrawnAt: new Date(),
      },
    );
  }
}
