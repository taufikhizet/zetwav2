import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

const transporter = nodemailer.createTransport({
  host: 'mail.livezet.id',
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: 'zetwa@livezet.id',
    pass: '123123123qweqweqwe',
  },
});

export const emailService = {
  sendVerificationEmail: async (email: string, token: string) => {
    // In a real app, this would be a link to the frontend
    // For now, let's assume the frontend URL is passed via env or hardcoded
    // Since we are in dev/analysis, I'll use a placeholder URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verificationLink = `${frontendUrl}/verify-email?token=${token}`;

    const mailOptions = {
      from: '"Zetwa Auth" <zetwa@livezet.id>',
      to: email,
      subject: 'Verify your email address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to Zetwa!</h2>
          <p>Please click the button below to verify your email address:</p>
          <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
          <p>Or copy and paste this link into your browser:</p>
          <p>${verificationLink}</p>
          <p>If you didn't create an account, you can safely ignore this email.</p>
        </div>
      `,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      logger.info(`Verification email sent: ${info.messageId}`);
      return true;
    } catch (error) {
      logger.error({ err: error }, 'Error sending verification email');
      return false;
    }
  },
};
