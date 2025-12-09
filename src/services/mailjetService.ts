import Mailjet from 'node-mailjet';

export interface EmailData {
  subject: string;
  message: string;
}

export class EmailService {
  private mailjet: any;
  private defaultSender: { Email: string; Name: string };

  constructor() {
    // Check if environment variables are loaded
    if (!process.env.MAILJET_API_KEY || !process.env.MAILJET_SECRET_KEY) {
      throw new Error('Mailjet API credentials are not properly configured in environment variables');
    }
    
    // Initialize Mailjet with API keys
    this.mailjet = Mailjet.apiConnect(
      process.env.MAILJET_API_KEY!,
      process.env.MAILJET_SECRET_KEY!
    );

    // Set default sender (you can customize this)
    this.defaultSender = {
      Email: "noreply@practiceflow.com",
      Name: "Practice Flow"
    };
  }

  /**
   * Send a notification email with enhanced template
   */
  async sendNotificationEmail(
    to: string,
    title: string,
    message: string,
    type: string,
    metadata?: any
  ): Promise<boolean> {
    try {
      const htmlTemplate = this.generateNotificationTemplate(title, message, type, metadata);
      
      const request = this.mailjet
        .post("send", { 'version': 'v3.1' })
        .request({
          Messages: [
            {
              From: this.defaultSender,
              To: [
                {
                  Email: to,
                  Name: to
                }
              ],
              Subject: title,
              HTMLPart: htmlTemplate,
              TextPart: message // Fallback text version
            }
          ]
        });

      const result = await request;
      console.log(`✅ Notification email sent successfully to ${to}`);
      console.log(`   Message ID: ${result.body.Messages[0].To[0].MessageID}`);
      return true;
    } catch (error) {
      console.error("❌ Error sending notification email:", error);
      return false;
    }
  }

  /**
   * Send welcome email with credentials
   */
  async sendWelcomeEmail(to: string, data: {
    subject: string;
    firstName: string;
    email: string;
    password: string;
    staffId: string;
    role: string;
    loginUrl: string;
  }): Promise<boolean> {
    try {
      const htmlTemplate = this.generateWelcomeTemplate(data);
      
      const request = this.mailjet
        .post("send", { 'version': 'v3.1' })
        .request({
          Messages: [
            {
              From: this.defaultSender,
              To: [
                {
                  Email: to,
                  Name: data.firstName
                }
              ],
              Subject: data.subject,
              HTMLPart: htmlTemplate,
              TextPart: `Hello ${data.firstName}, Your account has been created. Login URL: ${data.loginUrl}, Email: ${data.email}, Password: ${data.password}, Staff ID: ${data.staffId}, Role: ${data.role}. Please change your password after login.`
            }
          ]
        });

      const result = await request;
      console.log(`✅ Welcome email sent successfully to ${to}`);
      console.log(`   Message ID: ${result.body.Messages[0].To[0].MessageID}`);
      return true;
    } catch (error) {
      console.error("❌ Error sending welcome email:", error);
      return false;
    }
  }

  /**
   * Send basic email (legacy support)
   */
  async sendMail(to: string, data: EmailData): Promise<boolean> {
    try {
      const htmlTemplate = this.generateBasicTemplate(data.subject, data.message);
      
      const request = this.mailjet
        .post("send", { 'version': 'v3.1' })
        .request({
          Messages: [
            {
              From: this.defaultSender,
              To: [
                {
                  Email: to,
                  Name: to
                }
              ],
              Subject: data.subject,
              HTMLPart: htmlTemplate,
              TextPart: data.message // Fallback text version
            }
          ]
        });

      const result = await request;
      console.log(`✅ Basic email sent successfully to ${to}`);
      console.log(`   Message ID: ${result.body.Messages[0].To[0].MessageID}`);
      return true;
    } catch (error) {
      console.error("❌ Error sending email:", error);
      return false;
    }
  }

  /**
   * Test connection (legacy support)
   */
  async testConnection(): Promise<boolean> {
    try {
      const request = this.mailjet
        .get('contactslist')
        .request();
      
      await request;
      return true;
    } catch (error) {
      console.error('Mailjet connection test failed:', error);
      return false;
    }
  }

  /**
   * Generate notification email template
   */
  private generateNotificationTemplate(
    title: string,
    message: string,
    type: string,
    metadata?: any
  ): string {
    const typeColors: { [key: string]: string } = {
      expense: '#f59e0b',
      fuel_log: '#10b981',
      inventory: '#3b82f6',
      item_log: '#8b5cf6',
      wallet: '#06b6d4',
      activity_log: '#6b7280',
      general: '#2563eb',
    };

    const typeIcons: { [key: string]: string } = {
      expense: '💰',
      fuel_log: '⛽',
      inventory: '📦',
      item_log: '📋',
      wallet: '💳',
      activity_log: '📊',
      general: '🔔',
    };

    const color = typeColors[type] || '#2563eb';
    const icon = typeIcons[type] || '🔔';

    let metadataSection = '';
    if (metadata) {
      if (metadata.amount) {
        metadataSection = `
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #4a5568; font-size: 14px; margin: 0;">
              <strong>Amount:</strong> ₦${metadata.amount.toLocaleString()}
            </p>
          </div>
        `;
      }
    }

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Practice Flow Notification</title>
    </head>
    <body style="margin: 0; padding: 0; min-width: 100%; background-color: #f6f9fc;">
        <center style="width: 100%; table-layout: fixed; background-color: #f6f9fc; padding-top: 40px; padding-bottom: 40px;">
            <div style="max-width: 600px; background-color: #ffffff; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); border-radius: 12px; overflow: hidden;">
                <!-- Header -->
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                    <tr>
                        <td align="center" style="padding: 30px 20px; background-color: ${color};">
                            <div style="font-size: 32px; margin-bottom: 10px;">${icon}</div>
                            <h1 style="color: #ffffff; font-family: 'Arial', sans-serif; margin: 0; font-size: 28px;">Practice Flow</h1>
                            <p style="color: #ffffff; font-family: 'Arial', sans-serif; margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">
                              ${type.replace('_', ' ').toUpperCase()} NOTIFICATION
                            </p>
                        </td>
                    </tr>
                </table>

                <!-- Content -->
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                    <tr>
                        <td style="padding: 40px 30px; font-family: 'Arial', sans-serif;">
                            <h2 style="color: #1a1a1a; font-size: 24px; margin: 0 0 20px 0;">${title}</h2>
                            <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                ${message}
                            </p>
                            ${metadataSection}
                            <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
                                <p style="color: #64748b; font-size: 14px; margin: 0;">
                                    <strong>Time:</strong> ${new Date().toLocaleString()}
                                </p>
                            </div>
                        </td>
                    </tr>
                </table>

                <!-- Footer -->
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                    <tr>
                        <td align="center" style="padding: 30px; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
                            <p style="color: #64748b; font-family: 'Arial', sans-serif; font-size: 14px; margin: 0 0 10px 0;">
                                Questions? Contact our support team
                            </p>
                            <p style="color: #64748b; font-family: 'Arial', sans-serif; font-size: 14px; margin: 0;">
                                Email us at <a href="mailto:support@practiceflow.com" style="color: ${color}; text-decoration: none;">support@practiceflow.com</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </div>
        </center>
    </body>
    </html>
    `;
  }

  /**
   * Generate welcome email template with credentials
   */
  private generateWelcomeTemplate(data: {
    firstName: string;
    email: string;
    password: string;
    staffId: string;
    role: string;
    loginUrl: string;
  }): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Welcome to Practice Flow</title>
    </head>
    <body style="margin: 0; padding: 0; min-width: 100%; background-color: #f6f9fc;">
        <center style="width: 100%; table-layout: fixed; background-color: #f6f9fc; padding-top: 40px; padding-bottom: 40px;">
            <div style="max-width: 600px; background-color: #ffffff; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                    <tr>
                        <td align="center" style="padding: 20px 0; background-color: #2563eb;">
                            <h1 style="color: #ffffff; font-family: 'Arial', sans-serif; margin: 0; font-size: 28px;">🎉 Welcome to Practice Flow</h1>
                        </td>
                    </tr>
                </table>

                <!-- Content -->
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                    <tr>
                        <td style="padding: 40px 30px; font-family: 'Arial', sans-serif;">
                            <h2 style="color: #1a1a1a; font-size: 24px; margin: 0 0 20px 0;">Hello ${data.firstName}! 👋</h2>
                            <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                                Your account has been created successfully! Here are your login credentials:
                            </p>
                            
                            <!-- Credentials Box -->
                            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                                <p style="margin: 0 0 10px 0; color: #374151; font-size: 16px;"><strong>📧 Email:</strong> ${data.email}</p>
                                <p style="margin: 0 0 10px 0; color: #374151; font-size: 16px;"><strong>🔑 Temporary Password:</strong> <code style="background-color: #e5e7eb; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${data.password}</code></p>
                                <p style="margin: 0 0 10px 0; color: #374151; font-size: 16px;"><strong>🏷️ Staff ID:</strong> ${data.staffId}</p>
                                <p style="margin: 0; color: #374151; font-size: 16px;"><strong>👤 Role:</strong> ${data.role}</p>
                            </div>

                            <!-- Login Button -->
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${data.loginUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                                    🔗 Login to Your Account
                                </a>
                            </div>

                            <!-- Instructions -->
                            <div style="background-color: #fffbeb; border: 1px solid #fbbf24; border-radius: 8px; padding: 20px; margin: 20px 0;">
                                <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 18px;">📋 Getting Started:</h3>
                                <ol style="color: #92400e; margin: 0; padding-left: 20px;">
                                    <li style="margin-bottom: 8px;">Click the "Login to Your Account" button above</li>
                                    <li style="margin-bottom: 8px;">Enter your email and temporary password</li>
                                    <li style="margin-bottom: 8px;"><strong>Change your password immediately</strong> for security</li>
                                    <li>Start exploring your new account!</li>
                                </ol>
                            </div>

                            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                                <strong>Need help?</strong> If you have any issues accessing your account, please contact your administrator.
                            </p>

                            <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
                                Best regards,<br/>
                                <strong>The Practice Flow Team</strong>
                            </p>
                        </td>
                    </tr>
                </table>

                <!-- Footer -->
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                    <tr>
                        <td align="center" style="padding: 30px; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
                            <p style="color: #64748b; font-family: 'Arial', sans-serif; font-size: 14px; margin: 0 0 10px 0;">
                                Questions? Contact our support team
                            </p>
                            <p style="color: #64748b; font-family: 'Arial', sans-serif; font-size: 14px; margin: 0;">
                                Email us at <a href="mailto:support@practiceflow.com" style="color: #2563eb; text-decoration: none;">support@practiceflow.com</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </div>
        </center>
    </body>
    </html>
    `;
  }

  /**
   * Generate basic email template (legacy support)
   */
  private generateBasicTemplate(subject: string, message: string): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Practice Flow</title>
    </head>
    <body style="margin: 0; padding: 0; min-width: 100%; background-color: #f6f9fc;">
        <center style="width: 100%; table-layout: fixed; background-color: #f6f9fc; padding-top: 40px; padding-bottom: 40px;">
            <div style="max-width: 600px; background-color: #ffffff; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                    <tr>
                        <td align="center" style="padding: 20px 0; background-color: #2563eb;">
                            <h1 style="color: #ffffff; font-family: 'Arial', sans-serif; margin: 0; font-size: 28px;">Practice Flow</h1>
                        </td>
                    </tr>
                </table>

                <!-- Content -->
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                    <tr>
                        <td style="padding: 40px 30px; font-family: 'Arial', sans-serif;">
                            <h2 style="color: #1a1a1a; font-size: 24px; margin: 0 0 20px 0;">${subject}</h2>
                            <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                ${message}
                            </p>
                            <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                                Best regards,<br/>
                                The Practice Flow Team
                            </p>
                        </td>
                    </tr>
                </table>

                <!-- Footer -->
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                    <tr>
                        <td align="center" style="padding: 30px; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
                            <p style="color: #64748b; font-family: 'Arial', sans-serif; font-size: 14px; margin: 0 0 10px 0;">
                                Questions? Contact our support team
                            </p>
                            <p style="color: #64748b; font-family: 'Arial', sans-serif; font-size: 14px; margin: 0;">
                                Email us at <a href="mailto:support@practiceflow.com" style="color: #2563eb; text-decoration: none;">support@practiceflow.com</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </div>
        </center>
    </body>
    </html>
    `;
  }
}

// Legacy compatibility - export as MailjetService for existing code
export { EmailService as MailjetService };