import nodemailer from "nodemailer";
import { logger } from "../logger";

// Gmail SMTP configuration
// To use: Set GMAIL_USER and GMAIL_APP_PASSWORD in .env
// Get an App Password: https://myaccount.google.com/apppasswords
const GMAIL_USER = process.env.GMAIL_USER?.trim();
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD?.trim();

let transporter: nodemailer.Transporter | null = null;

if (GMAIL_USER && GMAIL_APP_PASSWORD) {
    transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: GMAIL_USER,
            pass: GMAIL_APP_PASSWORD,
        },
    });
    logger.info(`Email service configured with Gmail: ${GMAIL_USER}`);
} else {
    logger.warn("Email service not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in .env");
}

// In-memory OTP store: email -> { otp, expiresAt, attempts }
const otpStore = new Map<string, { otp: string; expiresAt: Date; attempts: number }>();

// Clean expired OTPs every 5 minutes
setInterval(() => {
    const now = new Date();
    otpStore.forEach((data, email) => {
        if (now > data.expiresAt) {
            otpStore.delete(email);
        }
    });
}, 5 * 60 * 1000);

/**
 * Generate a 6-digit OTP
 */
function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP email to user via Gmail SMTP
 */
export async function sendOTP(email: string): Promise<{ success: boolean; message: string }> {
    if (!transporter || !GMAIL_USER) {
        logger.error("Gmail SMTP is not configured");
        return { success: false, message: "Email service is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD." };
    }

    // Rate limit: max 3 OTP requests per email in 10 minutes
    const existing = otpStore.get(email);
    if (existing && existing.attempts >= 3 && new Date() < existing.expiresAt) {
        return { success: false, message: "Too many OTP requests. Please wait a few minutes." };
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    otpStore.set(email, {
        otp,
        expiresAt,
        attempts: (existing?.attempts || 0) + 1,
    });

    try {
        logger.info(`Attempting to send OTP email to ${email} via Gmail...`);
        const info = await transporter.sendMail({
            from: `"Prometix Support" <${GMAIL_USER}>`,
            to: email,
            subject: "Your Prometix Verification Code",
            html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 480px; margin: 0 auto; background: #0D1117; border-radius: 12px; overflow: hidden; border: 1px solid #30363D;">
          <div style="background: linear-gradient(135deg, #00E5FF 0%, #9C27B0 100%); padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🚀 Prometix</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 4px 0 0; font-size: 14px;">AI DevOps Platform</p>
          </div>
          <div style="padding: 32px; text-align: center;">
            <h2 style="color: #E6EDF3; margin: 0 0 8px; font-size: 20px;">Verify Your Email</h2>
            <p style="color: #8B949E; margin: 0 0 24px; font-size: 14px;">Enter this code to complete your registration</p>
            <div style="background: #161B22; border: 2px solid #00E5FF; border-radius: 8px; padding: 16px; display: inline-block; min-width: 200px;">
              <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #00E5FF;">${otp}</span>
            </div>
            <p style="color: #8B949E; margin: 24px 0 0; font-size: 12px;">This code expires in <strong style="color: #E6EDF3;">10 minutes</strong></p>
            <p style="color: #6E7681; margin: 16px 0 0; font-size: 11px;">If you didn't request this, you can safely ignore this email.</p>
          </div>
        </div>
      `,
        });

        logger.info(`OTP successfully sent to ${email}. MessageId: ${info.messageId}`);
        return { success: true, message: "Verification code sent to your email" };
    } catch (error: any) {
        logger.error("Detailed Gmail SMTP Error:", {
            message: error.message,
            code: error.code,
            command: error.command,
            response: error.response,
            stack: error.stack
        });

        if (error.code === 'EAUTH') {
            return { success: false, message: "Email service authentication failed. Check GMAIL_APP_PASSWORD in .env." };
        }

        return { success: false, message: "Failed to send verification email. Error: " + (error.message || "Unknown error") };
    }
}

/**
 * Verify OTP for an email
 */
export function verifyOTP(email: string, otp: string): { valid: boolean; message: string } {
    const stored = otpStore.get(email);

    if (!stored) {
        return { valid: false, message: "No verification code found. Please request a new one." };
    }

    if (new Date() > stored.expiresAt) {
        otpStore.delete(email);
        return { valid: false, message: "Verification code expired. Please request a new one." };
    }

    if (stored.otp !== otp) {
        return { valid: false, message: "Invalid verification code. Please try again." };
    }

    // Valid — remove from store
    otpStore.delete(email);
    return { valid: true, message: "Email verified successfully" };
}

/**
 * Send Password Reset Link email
 */
export async function sendResetLink(email: string, token: string): Promise<{ success: boolean; message: string }> {
    if (!transporter || !GMAIL_USER) {
        return { success: false, message: "Email service is not configured" };
    }

    const resetUrl = `${process.env.APP_URL || 'http://localhost:5002'}/auth?resetToken=${token}`;

    try {
        const info = await transporter.sendMail({
            from: `"Prometix Support" <${GMAIL_USER}>`,
            to: email,
            subject: "Reset Your Prometix Password",
            html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 480px; margin: 0 auto; background: #0D1117; border-radius: 12px; overflow: hidden; border: 1px solid #30363D;">
          <div style="background: linear-gradient(135deg, #00E5FF 0%, #9C27B0 100%); padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🚀 Prometix</h1>
          </div>
          <div style="padding: 32px; text-align: center;">
            <h2 style="color: #E6EDF3; margin: 0 0 8px; font-size: 20px;">Password Reset Request</h2>
            <p style="color: #8B949E; margin: 0 0 24px; font-size: 14px;">Click the button below to reset your password. This link will expire in 1 hour.</p>
            <a href="${resetUrl}" style="background: #00E5FF; color: #0D1117; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">Reset Password</a>
            <p style="color: #6E7681; margin: 24px 0 0; font-size: 11px;">If you didn't request this, you can safely ignore this email.</p>
            <p style="color: #6E7681; margin: 12px 0 0; font-size: 10px; word-break: break-all;">Link: ${resetUrl}</p>
          </div>
        </div>
      `,
        });

        logger.info(`Reset link sent to ${email}. MessageId: ${info.messageId}`);
        return { success: true, message: "Reset link sent to your email" };
    } catch (error: any) {
        logger.error("Failed to send reset link email", error);
        return { success: false, message: "Failed to send reset email. Please try again." };
    }
}

export function isEmailServiceConfigured(): boolean {
    return !!transporter;
}
