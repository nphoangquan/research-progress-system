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
   * Send welcome email with optional email verification
   */
  async sendWelcomeEmail(user: { email: string; fullName: string }, verificationToken: string | null = null): Promise<void> {
    const verificationUrl = verificationToken 
      ? `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email/${verificationToken}`
      : null;

    const verificationSection = verificationUrl ? `
      <p>Để hoàn tất đăng ký, vui lòng xác thực địa chỉ email của bạn bằng cách nhấp vào nút bên dưới:</p>
      <div style="text-align: center;">
        <a href="${verificationUrl}" class="button">Xác thực Email</a>
      </div>
      <p>Hoặc sao chép và dán liên kết này vào trình duyệt của bạn:</p>
      <p style="word-break: break-all; color: #4F46E5;">${verificationUrl}</p>
      <p>Liên kết này sẽ hết hạn sau 24 giờ.</p>
    ` : `
      <p>Tài khoản của bạn đã được tạo thành công. Bạn có thể đăng nhập vào hệ thống ngay bây giờ.</p>
    `;

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
              <h1>Chào mừng đến Hệ thống Quản lý Tiến độ Nghiên cứu!</h1>
            </div>
            <div class="content">
              <p>Xin chào ${user.fullName},</p>
              <p>Cảm ơn bạn đã đăng ký với Hệ thống Quản lý Tiến độ Nghiên cứu. Chúng tôi rất vui mừng được chào đón bạn!</p>
              ${verificationSection}
              <p>Nếu bạn không tạo tài khoản này, vui lòng bỏ qua email này.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Hệ thống Quản lý Tiến độ Nghiên cứu. Bảo lưu mọi quyền.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: user.email,
      subject: verificationUrl ? 'Chào mừng! Vui lòng xác thực email của bạn' : 'Chào mừng đến Hệ thống Quản lý Tiến độ Nghiên cứu!',
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
              <h1>Yêu cầu Đặt lại Mật khẩu</h1>
            </div>
            <div class="content">
              <p>Xin chào ${user.fullName},</p>
              <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản Hệ thống Quản lý Tiến độ Nghiên cứu của bạn.</p>
              <p>Nhấp vào nút bên dưới để đặt lại mật khẩu:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Đặt lại Mật khẩu</a>
              </div>
              <p>Hoặc sao chép và dán liên kết này vào trình duyệt của bạn:</p>
              <p style="word-break: break-all; color: #DC2626;">${resetUrl}</p>
              <div class="warning">
                <p><strong>WARNING: Thông báo Bảo mật:</strong></p>
                <p>Liên kết này sẽ hết hạn sau 1 giờ. Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này và mật khẩu của bạn sẽ không thay đổi.</p>
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Hệ thống Quản lý Tiến độ Nghiên cứu. Bảo lưu mọi quyền.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: user.email,
      subject: 'Yêu cầu Đặt lại Mật khẩu',
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
              <h1>Xác thực Địa chỉ Email của Bạn</h1>
            </div>
            <div class="content">
              <p>Xin chào ${user.fullName},</p>
              <p>Chúng tôi nhận thấy bạn chưa xác thực địa chỉ email của mình. Vui lòng xác thực email để truy cập đầy đủ các tính năng của Hệ thống Quản lý Tiến độ Nghiên cứu.</p>
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Xác thực Email</a>
              </div>
              <p>Hoặc sao chép và dán liên kết này vào trình duyệt của bạn:</p>
              <p style="word-break: break-all; color: #F59E0B;">${verificationUrl}</p>
              <p>Liên kết này sẽ hết hạn sau 24 giờ.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Hệ thống Quản lý Tiến độ Nghiên cứu. Bảo lưu mọi quyền.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: user.email,
      subject: 'Vui lòng xác thực địa chỉ email của bạn',
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
              <h1>Đổi Mật khẩu Thành công</h1>
            </div>
            <div class="content">
              <p>Xin chào ${user.fullName},</p>
              <p>Mật khẩu của bạn đã được thay đổi thành công.</p>
              <div class="warning">
                <p><strong>WARNING: Thông báo Bảo mật:</strong></p>
                <p>Nếu bạn không thực hiện thay đổi này, vui lòng liên hệ với chúng tôi ngay lập tức và cân nhắc đổi mật khẩu lại.</p>
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Hệ thống Quản lý Tiến độ Nghiên cứu. Bảo lưu mọi quyền.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: user.email,
      subject: 'Đổi Mật khẩu Thành công',
      html,
    });
  }

  /**
   * Send admin password reset email (with new password)
   */
  async sendAdminPasswordResetEmail(user: { email: string; fullName: string }, newPassword: string): Promise<void> {
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
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
            .password-box { background: #F3F4F6; border: 2px solid #D1D5DB; border-radius: 6px; padding: 16px; margin: 20px 0; text-align: center; }
            .password-text { font-family: monospace; font-size: 18px; font-weight: bold; color: #1F2937; letter-spacing: 2px; }
            .warning { background: #FEF2F2; border-left: 4px solid #DC2626; padding: 12px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Mật khẩu đã được Đặt lại</h1>
            </div>
            <div class="content">
              <p>Xin chào ${user.fullName},</p>
              <p>Quản trị viên đã đặt lại mật khẩu cho tài khoản của bạn trong Hệ thống Quản lý Tiến độ Nghiên cứu.</p>
              <p>Mật khẩu mới của bạn là:</p>
              <div class="password-box">
                <div class="password-text">${newPassword}</div>
              </div>
              <p>Vui lòng đăng nhập và thay đổi mật khẩu này ngay sau khi đăng nhập để bảo mật tài khoản của bạn.</p>
              <div class="warning">
                <p><strong>WARNING: Thông báo Bảo mật:</strong></p>
                <p>Vui lòng không chia sẻ mật khẩu này với bất kỳ ai. Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng liên hệ với quản trị viên ngay lập tức.</p>
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Hệ thống Quản lý Tiến độ Nghiên cứu. Bảo lưu mọi quyền.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: user.email,
      subject: 'Mật khẩu đã được Đặt lại bởi Quản trị viên',
      html,
    });
  }

  /**
   * Send test email (for admin testing SMTP configuration)
   */
  async sendTestEmail(to: string, html: string): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Email Test - Research Progress Management System',
      html,
    });
  }
}

export default new EmailService();

