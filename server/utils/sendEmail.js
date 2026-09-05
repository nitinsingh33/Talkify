const { Resend } = require("resend");
const nodemailer = require("nodemailer");
const { RESEND_API_KEY, EMAIL, PASSWORD } = require("../secrets.js");
const logger = require("./logger.js");

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

let mailTransporter = null;
if (EMAIL && PASSWORD) {
  mailTransporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    family: 4,
    auth: {
      user: EMAIL,
      pass: PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
  });
}

/**
 * Send an email via Resend (HTTPS) with optional Nodemailer fallback.
 * @param {{ to: string, subject: string, html: string }} options
 */
const sendEmail = async ({ to, subject, html }) => {
  if (resend) {
    const { data, error } = await resend.emails.send({
      from: "Talkify <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    });

    if (error) {
      logger.error({ err: error }, "Resend error");
      throw new Error(error.message || "Failed to send email via Resend");
    }

    return data;
  }

  if (mailTransporter) {
    return await mailTransporter.sendMail({
      from: `"Talkify" <${EMAIL}>`,
      to,
      subject,
      html,
    });
  }

  throw new Error("No email provider configured (RESEND_API_KEY or EMAIL/PASSWORD missing)");
};

module.exports = sendEmail;
