/**
 * Generates an HTML email template for a token transfer receipt.
 * 
 * @param {Object} data
 * @param {string} data.senderName - Name or wallet of the sender
 * @param {string|number} data.amount - The amount sent
 * @param {string} data.tokenSymbol - Token symbol (e.g., USDC, EURC)
 * @param {string} [data.txHash] - Transaction hash (optional)
 * @param {string} [data.network] - Network name (e.g., Base, Polygon) (optional)
 * @param {string} [data.appLink] - Link to the app to claim/view the transfer
 * @returns {string} - Generated HTML string
 */
export const buildTransferReceiptEmail = ({
  senderName = "A user",
  amount,
  tokenSymbol,
  txHash,
  network,
  appLink = "https://einherjar.online"
}) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>You received funds!</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #f4f4f5;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        .header {
          background-color: #ff4500; /* Kinetic Orange */
          color: white;
          text-align: center;
          padding: 30px 20px;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.5px;
        }
        .content {
          padding: 30px;
          color: #18181b;
          line-height: 1.6;
        }
        .amount-box {
          background-color: #fff7ed;
          border: 1px solid #ffedd5;
          border-radius: 6px;
          padding: 20px;
          text-align: center;
          margin: 20px 0;
        }
        .amount {
          font-size: 36px;
          font-weight: 800;
          color: #c2410c;
          margin: 0;
        }
        .details {
          margin-top: 30px;
          border-top: 1px solid #e4e4e7;
          padding-top: 20px;
          font-size: 14px;
          color: #52525b;
        }
        .details strong {
          color: #18181b;
        }
        .details ul {
          list-style: none;
          padding: 0;
          margin: 10px 0 0 0;
        }
        .details li {
          margin-bottom: 8px;
          padding-bottom: 8px;
          border-bottom: 1px dashed #e4e4e7;
        }
        .details li:last-child {
          border-bottom: none;
        }
        .btn {
          display: inline-block;
          background-color: #09090b;
          color: #ffffff !important;
          text-decoration: none;
          padding: 14px 28px;
          border-radius: 6px;
          font-weight: 600;
          margin-top: 10px;
          text-align: center;
        }
        .footer {
          background-color: #fafafa;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #a1a1aa;
          border-top: 1px solid #e4e4e7;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>You received funds! 🚀</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p><strong>${senderName}</strong> just sent digital tokens directly to your email.</p>
          
          <div class="amount-box">
            <p class="amount">${amount} ${tokenSymbol}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${appLink}" class="btn">Access My Wallet</a>
          </div>

          <p>If you don't have an account yet, simply log in with this email on the Einherjar app to access your wallet and use your funds.</p>

          <div class="details">
            <p><strong>Transfer Details:</strong></p>
            <ul>
              <li><strong>Asset:</strong> ${tokenSymbol}</li>
              ${network ? `<li><strong>Blockchain Network:</strong> ${network}</li>` : ''}
              ${txHash ? `<li><strong>Transaction Hash:</strong> <br><span style="word-break: break-all; font-family: monospace; color: #71717a;">${txHash}</span></li>` : ''}
            </ul>
          </div>
          
        </div>
        <div class="footer">
          <p>Einherjar &copy; ${new Date().getFullYear()}. All rights reserved.</p>
          <p>This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
