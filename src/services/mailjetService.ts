import Mailjet from 'node-mailjet';

interface EmailData {
  to: string;
  subject: string;
  body?: string;
  html?: string;
  from?: string;
  fromName?: string;
}

class MailjetService {
  private mailjet: any;
  private defaultFrom: string;
  private defaultFromName: string;

  constructor() {
    const apiKey = process.env.MAILJET_API_KEY;
    const secretKey = process.env.MAILJET_SECRET_KEY;

    if (!apiKey || !secretKey) {
      throw new Error('Mailjet API key and secret key are required');
    }

    this.mailjet = Mailjet.apiConnect(apiKey, secretKey);
    this.defaultFrom = 'noreply@practiceflow.com'; // Change to your verified sender
    this.defaultFromName = 'Practice Flow';
  }

  async sendEmail(emailData: EmailData): Promise<any> {
    try {
      const { to, subject, body, html, from, fromName } = emailData;

      // Prepare email content
      let content: any = {};
      
      if (html) {
        content.HTMLPart = html;
      }
      
      if (body) {
        content.TextPart = body;
      }

      // If no content provided, use body as text
      if (!html && !body) {
        throw new Error('Either body or html content is required');
      }

      const request = await this.mailjet
        .post('send', { version: 'v3.1' })
        .request({
          Messages: [
            {
              From: {
                Email: from || this.defaultFrom,
                Name: fromName || this.defaultFromName
              },
              To: [
                {
                  Email: to,
                  Name: to.split('@')[0] // Use email username as name fallback
                }
              ],
              Subject: subject,
              ...content
            }
          ]
        });

      console.log('✅ Email sent successfully via Mailjet');
      return {
        success: true,
        messageId: request.body?.Messages?.[0]?.To?.[0]?.MessageID,
        data: request.body
      };

    } catch (error: any) {
      console.error('❌ Mailjet email error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async sendTemplateEmail(to: string, templateId: number, variables: Record<string, any>): Promise<any> {
    try {
      const request = await this.mailjet
        .post('send', { version: 'v3.1' })
        .request({
          Messages: [
            {
              From: {
                Email: this.defaultFrom,
                Name: this.defaultFromName
              },
              To: [
                {
                  Email: to,
                  Name: to.split('@')[0]
                }
              ],
              TemplateID: templateId,
              TemplateLanguage: true,
              Variables: variables
            }
          ]
        });

      console.log('✅ Template email sent successfully via Mailjet');
      return {
        success: true,
        messageId: request.body?.Messages?.[0]?.To?.[0]?.MessageID,
        data: request.body
      };

    } catch (error: any) {
      console.error('❌ Mailjet template email error:', error);
      throw new Error(`Failed to send template email: ${error.message}`);
    }
  }

  // Test email connection
  async testConnection(): Promise<boolean> {
    try {
      // Test by sending a simple email to yourself
      await this.sendEmail({
        to: this.defaultFrom,
        subject: 'Practice Flow Backend - Email Test',
        body: 'This is a test email from Practice Flow backend. If you receive this, Mailjet is configured correctly!',
        html: '<h1>Email Test Successful!</h1><p>Mailjet integration is working correctly for Practice Flow backend.</p>'
      });
      return true;
    } catch (error) {
      console.error('Mailjet connection test failed:', error);
      return false;
    }
  }
}

export default MailjetService;