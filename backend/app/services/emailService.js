import nodemailer from "nodemailer";
import logger from "./logger.js";

let cachedTransporter = null;

export function useRealEmailOTP() {
  return (
    process.env.USE_REAL_EMAIL_OTP === "true" ||
    process.env.USE_REAL_EMAIL_OTP === "1"
  );
}

function parseSmtpPort() {
  return parseInt(process.env.SMTP_PORT || "587", 10);
}

function parseSmtpSecure(port) {
  if (process.env.SMTP_SECURE === "true" || process.env.SMTP_SECURE === "1") {
    return true;
  }

  if (process.env.SMTP_SECURE === "false" || process.env.SMTP_SECURE === "0") {
    return false;
  }

  return port === 465;
}

function getMailFrom() {
  const fromAddress = String(process.env.MAIL_FROM || "").trim();
  const fromName = String(process.env.MAIL_FROM_NAME || "").trim();

  if (!fromAddress) {
    const error = new Error("MAIL_FROM is required for email OTP delivery");
    error.statusCode = 500;
    throw error;
  }

  return fromName ? `${fromName} <${fromAddress}>` : fromAddress;
}

function getTransportConfig() {
  const host = String(process.env.SMTP_HOST || "").trim();
  const port = parseSmtpPort();
  const secure = parseSmtpSecure(port);
  const user = String(process.env.SMTP_USER || "").trim();
  const pass = String(process.env.SMTP_PASS || "").trim();

  if (!host) {
    const error = new Error("SMTP_HOST is required for email OTP delivery");
    error.statusCode = 500;
    throw error;
  }

  if (!Number.isFinite(port) || port <= 0) {
    const error = new Error("SMTP_PORT must be a valid number");
    error.statusCode = 500;
    throw error;
  }

  if ((user && !pass) || (!user && pass)) {
    const error = new Error("SMTP_USER and SMTP_PASS must be provided together");
    error.statusCode = 500;
    throw error;
  }

  return {
    host,
    port,
    secure,
    ...(user && pass
      ? {
          auth: {
            user,
            pass,
          },
        }
      : {}),
  };
}

function getTransporter() {
  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport(getTransportConfig());
  }

  return cachedTransporter;
}

export async function sendSellerVerificationOtpEmail({
  email,
  otp,
  expiresInMinutes,
}) {
  if (!useRealEmailOTP()) {
    logger.info("Seller email OTP generated in mock mode", {
      email,
      otp,
      mode: "mock",
    });
    return {
      delivered: false,
      mode: "mock",
    };
  }

  const transporter = getTransporter();
  await transporter.sendMail({
    from: getMailFrom(),
    to: email,
    subject: "Verify your seller signup email",
    text: `Your seller signup verification code is ${otp}. This code expires in ${expiresInMinutes} minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #0f172a;">
        <p>Your seller signup verification code is:</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px;">${otp}</p>
        <p>This code expires in ${expiresInMinutes} minutes.</p>
      </div>
    `,
  });

  return {
    delivered: true,
    mode: "real",
  };
}

export async function sendCustomerOtpEmail({
  email,
  otp,
  expiresInMinutes = 5,
  flow = "login",
}) {
  if (!useRealEmailOTP()) {
    logger.info("Customer email OTP generated in mock mode", {
      email,
      otp,
      flow,
      mode: "mock",
    });
    console.log(`\n==========================================`);
    console.log(`[CUSTOMER EMAIL OTP] To: ${email} | OTP: ${otp} | Flow: ${flow}`);
    console.log(`==========================================\n`);
    return {
      delivered: false,
      mode: "mock",
    };
  }

  const transporter = getTransporter();
  await transporter.sendMail({
    from: getMailFrom(),
    to: email,
    subject: `Your Jain Aahar Verification Code: ${otp}`,
    text: `Your verification code for Jain Aahar is ${otp}. This code expires in ${expiresInMinutes} minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #f97316; margin: 0; font-size: 24px;">Jain Aahar</h2>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Account Verification</p>
        </div>
        <div style="background-color: #fff7ed; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 20px; border: 1px solid #ffedd5;">
          <p style="color: #475569; font-size: 14px; margin-top: 0; margin-bottom: 12px;">Your 4-Digit Verification Code:</p>
          <p style="font-size: 34px; font-weight: 800; color: #ea580c; letter-spacing: 8px; margin: 12px 0;">${otp}</p>
          <p style="color: #94a3b8; font-size: 12px; margin-bottom: 0;">This code is valid for ${expiresInMinutes} minutes.</p>
        </div>
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">If you did not request this code, please ignore this email.</p>
      </div>
    `,
  });

  return {
    delivered: true,
    mode: "real",
  };
}

export function __resetEmailTransportForTests() {
  cachedTransporter = null;
}
