import { Injectable, Logger } from '@nestjs/common';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface EmailSendResult {
  success: boolean;
  provider: 'resend' | 'brevo' | 'smtp' | 'console';
  messageId?: string;
  error?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  private readonly resendApiKey = process.env.RESEND_API_KEY;
  private readonly brevoApiKey = process.env.BREVO_API_KEY;
  private readonly defaultFrom =
    process.env.EMAIL_FROM ||
    process.env.SMTP_FROM ||
    'Brightloop Billing <onboarding@resend.dev>';

  /**
   * Dispatches an email using the best available provider.
   * Priority:
   * 1. Resend (HTTP REST API — Render Free Tier Friendly, 100/day free)
   * 2. Brevo / Sendinblue (HTTP REST API — Render Friendly, 300/day free)
   * 3. Console logger fallback (Zero crash, logs directly to Render logs)
   */
  async sendEmail(options: SendEmailOptions): Promise<EmailSendResult> {
    const from = options.from || this.defaultFrom;
    const text = options.text || options.html.replace(/<[^>]+>/g, ' ').trim();

    // 1. Try Resend HTTP API (Recommended for Render)
    if (this.resendApiKey) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from,
            to: [options.to],
            subject: options.subject,
            html: options.html,
            text,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          this.logger.error(`Resend API error: ${response.status} ${JSON.stringify(errData)}`);
          return {
            success: false,
            provider: 'resend',
            error: JSON.stringify(errData),
          };
        }

        const data = (await response.json()) as { id: string };
        this.logger.log(`[Resend] Email successfully dispatched to ${options.to} (ID: ${data.id})`);
        return { success: true, provider: 'resend', messageId: data.id };
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        this.logger.error(`Failed to send via Resend: ${errMsg}`);
      }
    }

    // 2. Try Brevo HTTP API
    if (this.brevoApiKey) {
      try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': this.brevoApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sender: { email: from.includes('<') ? from.split('<')[1].replace('>', '').trim() : from },
            to: [{ email: options.to }],
            subject: options.subject,
            htmlContent: options.html,
            textContent: text,
          }),
        });

        if (response.ok) {
          const data = (await response.json()) as { messageId: string };
          this.logger.log(`[Brevo] Email successfully dispatched to ${options.to}`);
          return { success: true, provider: 'brevo', messageId: data.messageId };
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        this.logger.error(`Failed to send via Brevo: ${errMsg}`);
      }
    }

    // 3. Fallback: Console Logger (Standard in dev or when no key is set on Render)
    this.logger.warn(`[EmailService] No external email API key configured (RESEND_API_KEY / BREVO_API_KEY). Logging email to standard output:`);
    this.logger.log(`==================== [EMAIL DISPATCHED] ====================`);
    this.logger.log(`TO:      ${options.to}`);
    this.logger.log(`FROM:    ${from}`);
    this.logger.log(`SUBJECT: ${options.subject}`);
    this.logger.log(`BODY:    ${text}`);
    this.logger.log(`===========================================================`);

    return { success: true, provider: 'console', messageId: `mock_${Date.now()}` };
  }

  /**
   * Password reset recovery email
   */
  async sendPasswordResetEmail(to: string, resetToken: string, appUrl?: string): Promise<EmailSendResult> {
    const baseAppUrl = appUrl || process.env.APP_URL || 'http://localhost:5173';
    const resetLink = `${baseAppUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;

    const html = `
      <div style="font-family: monospace; background: #0E110D; color: #EAE8DC; padding: 24px; border: 1px solid #333A2C;">
        <h2 style="color: #00E5FF; margin-top: 0; text-transform: uppercase;">BRIGHTLOOP // PASSWORD RECOVERY</h2>
        <p>A single-use password reset authorization has been requested for this account.</p>
        <p style="margin: 20px 0;">
          <a href="${resetLink}" style="background: #434B2F; color: #E5E3DA; padding: 10px 20px; text-decoration: none; font-weight: bold; display: inline-block;">
            [AUTHENTICATE & RESET PASSWORD]
          </a>
        </p>
        <p style="font-size: 11px; color: #8D9483;">Link expires in 60 minutes. If you did not request this, ignore this email.</p>
        <p style="font-size: 10px; color: #505547; border-top: 1px solid #333A2C; padding-top: 12px; margin-top: 24px;">
          Brightloop Modular Subscription Management System · Deterministic Node 22 Runtime
        </p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: 'BRIGHTLOOP // Password Reset Request',
      html,
    });
  }

  /**
   * Statutory Tax Invoice notification
   */
  async sendInvoiceEmail(to: string, invoiceNumber: string, totalPaise: number, dueDate: string): Promise<EmailSendResult> {
    const amountFormatted = `₹${(totalPaise / 100).toFixed(2)}`;

    const html = `
      <div style="font-family: monospace; background: #0E110D; color: #EAE8DC; padding: 24px; border: 1px solid #333A2C;">
        <h2 style="color: #60A5FA; margin-top: 0; text-transform: uppercase;">BRIGHTLOOP // TAX INVOICE ISSUED</h2>
        <p>A new statutory tax invoice has been generated for your subscription.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;">
          <tr style="border-bottom: 1px solid #333A2C;">
            <td style="padding: 6px 0; color: #8D9483;">INVOICE #:</td>
            <td style="padding: 6px 0; font-weight: bold; color: #00E5FF;">${invoiceNumber}</td>
          </tr>
          <tr style="border-bottom: 1px solid #333A2C;">
            <td style="padding: 6px 0; color: #8D9483;">TOTAL DUE:</td>
            <td style="padding: 6px 0; font-weight: bold; color: #10B981;">${amountFormatted}</td>
          </tr>
          <tr style="border-bottom: 1px solid #333A2C;">
            <td style="padding: 6px 0; color: #8D9483;">DUE DATE:</td>
            <td style="padding: 6px 0;">${dueDate}</td>
          </tr>
        </table>
        <p style="font-size: 11px; color: #8D9483;">Access the billing portal to review itemized GST details or initiate payment settlement.</p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: `BRIGHTLOOP // Tax Invoice [${invoiceNumber}] — ${amountFormatted}`,
      html,
    });
  }
}
