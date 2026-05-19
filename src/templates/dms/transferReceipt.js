/**
 * Generates a text message template for a Twitter DM receipt.
 * 
 * @param {Object} data
 * @param {string} data.senderName - Name or handle of the sender
 * @param {string|number} data.amount - The amount sent
 * @param {string} data.tokenSymbol - Token symbol (e.g., USDC, EURC)
 * @param {string} [data.txHash] - Transaction hash (optional)
 * @param {string} [data.network] - Network name (e.g., Base, Polygon) (optional)
 * @param {string} [data.appLink] - Link to the app to claim/view the transfer
 * @returns {string} - Generated message string
 */
export const buildTransferReceiptDM = ({
  senderName = "A user",
  amount,
  tokenSymbol,
  txHash,
  network,
  appLink = "https://einherjar.online"
}) => {
  return `🚀 You received funds!

Hello! ${senderName} just sent you digital tokens directly to your X account.

💰 Amount: ${amount} ${tokenSymbol}
${network ? `🌐 Network: ${network}\n` : ''}${txHash ? `🔗 Hash: ${txHash}\n` : ''}
Access your wallet and manage your funds by logging into Einherjar:
${appLink}

If you don't have an account yet, simply log in using your X account.`;
};
