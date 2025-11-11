import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify email configuration only if credentials are provided
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter.verify((error, success) => {
    if (error) {
      logger.warn('Email service configuration error:', { error: error.message });
      logger.warn('Email functionality will be disabled until SMTP credentials are configured.');
    } else {
      logger.info('Email service is ready to send emails');
    }
  });
} else {
  logger.warn('SMTP credentials not configured. Email functionality will be disabled.');
  logger.warn('Please set SMTP_USER and SMTP_PASS in your .env file to enable email features.');
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  /**
   * Send email
   */
  private async sendEmail(options: EmailOptions): Promise<void> {
    // Check if SMTP is configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      logger.warn(`Email not sent to ${options.to}: SMTP credentials not configured`);
      throw new Error('SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS in your .env file.');
    }

    try {
      const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME || 'Research Progress System'}" <${process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ''), // Plain text version
      };

      await transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${options.to}`);
    } catch (error) {
      logger.error('Error sending email:', { error, to: options.to });
      throw new Error('Failed to send email');
    }
  }

  /**
   * Send welcome email with email verification
   */
  async sendWelcomeEmail(user: { email: string; fullName: string }, verificationToken: string): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email/${verificationToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Research Progress System!</h1>
            </div>
            <div class="content">
              <p>Hello ${user.fullName},</p>
              <p>Thank you for registering with Research Progress System. We're excited to have you on board!</p>
              <p>To complete your registration, please verify your email address by clicking the button below:</p>
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #4F46E5;">${verificationUrl}</p>
              <p>This link will expire in 24 hours.</p>
              <p>If you didn't create an account, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Research Progress System. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: user.email,
      subject: 'Welcome! Please verify your email',
      html,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(user: { email: string; fullName: string }, resetToken: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #DC2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 24px; background: #DC2626; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
            .warning { background: #FEF2F2; border-left: 4px solid #DC2626; padding: 12px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello ${user.fullName},</p>
              <p>We received a request to reset your password for your Research Progress System account.</p>
              <p>Click the button below to reset your password:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #DC2626;">${resetUrl}</p>
              <div class="warning">
                <p><strong>⚠️ Security Notice:</strong></p>
                <p>This link will expire in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Research Progress System. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      html,
    });
  }

  /**
   * Send email verification reminder
   */
  async sendVerificationReminderEmail(user: { email: string; fullName: string }, verificationToken: string): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email/${verificationToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #F59E0B; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 24px; background: #F59E0B; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Verify Your Email Address</h1>
            </div>
            <div class="content">
              <p>Hello ${user.fullName},</p>
              <p>We noticed that you haven't verified your email address yet. Please verify your email to access all features of Research Progress System.</p>
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #F59E0B;">${verificationUrl}</p>
              <p>This link will expire in 24 hours.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Research Progress System. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: user.email,
      subject: 'Please verify your email address',
      html,
    });
  }

  /**
   * Send password changed notification
   */
  async sendPasswordChangedEmail(user: { email: string; fullName: string }): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
            .warning { background: #FEF2F2; border-left: 4px solid #DC2626; padding: 12px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Changed Successfully</h1>
            </div>
            <div class="content">
              <p>Hello ${user.fullName},</p>
              <p>Your password has been successfully changed.</p>
              <div class="warning">
                <p><strong>⚠️ Security Notice:</strong></p>
                <p>If you didn't make this change, please contact us immediately and consider changing your password again.</p>
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Research Progress System. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: user.email,
      subject: 'Password Changed Successfully',
      html,
    });
  }
}

export default new EmailService();

