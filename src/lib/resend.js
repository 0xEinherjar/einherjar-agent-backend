import { Resend } from "resend";
import logger from "./logger.js";
import { constants } from "../shared/constant.js";

const resend = new Resend(constants.RESEND_API_KEY);

/**
 * Sends an email using the Resend API.
 * 
 * @param {Object} options
 * @param {string} [options.from] - Sender email address. Defaults to env.RESEND_FROM_EMAIL.
 * @param {string|string[]} options.to - Recipient email address(es).
 * @param {string} options.subject - Email subject.
 * @param {string} options.html - Email HTML content.
 * @returns {Promise<{data: any, error: any}>}
 */
export const sendEmail = async ({ from, to, subject, html }) => {
  const sender = from || "Einherjar <info@einherjar.online>";
  
  if (!to || !subject || !html) {
    const errorMsg = "Missing required email parameters: 'to', 'subject', or 'html'";
    logger.error(`[Resend] ${errorMsg}`);
    return { data: null, error: new Error(errorMsg) };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: sender,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });

    if (error) {
      logger.error(`[Resend] Error sending email to ${to}:`, error);
      return { data: null, error };
    }

    logger.info(`[Resend] Email sent successfully to ${to} (ID: ${data?.id})`);
    return { data, error: null };
  } catch (error) {
    logger.error(`[Resend] Unexpected error sending email to ${to}:`, error);
    return { data: null, error };
  }
};

export default resend;
