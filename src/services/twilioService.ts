import twilio from 'twilio';

interface SMSData {
  to: string;
  message: string;
  from?: string;
}

interface WhatsAppData {
  to: string;
  message: string;
  mediaUrl?: string;
}

class TwilioService {
  private client: any;
  private whatsappNumber: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

    if (!accountSid || !authToken) {
      throw new Error('Twilio Account SID and Auth Token are required');
    }

    if (!whatsappNumber) {
      throw new Error('Twilio WhatsApp number is required');
    }

    this.client = twilio(accountSid, authToken);
    this.whatsappNumber = whatsappNumber;
  }

  async sendSMS(smsData: SMSData): Promise<any> {
    try {
      const { to, message, from } = smsData;

      // Format phone number to ensure it has country code
      const formattedTo = to.startsWith('+') ? to : `+1${to.replace(/\D/g, '')}`;

      const messageResponse = await this.client.messages.create({
        body: message,
        from: from || this.whatsappNumber, // Use WhatsApp number as fallback
        to: formattedTo
      });

      console.log('✅ SMS sent successfully via Twilio');
      return {
        success: true,
        messageId: messageResponse.sid,
        status: messageResponse.status,
        to: formattedTo,
        from: messageResponse.from
      };

    } catch (error: any) {
      console.error('❌ Twilio SMS error:', error);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  async sendWhatsApp(whatsappData: WhatsAppData): Promise<any> {
    try {
      const { to, message, mediaUrl } = whatsappData;

      // Format phone number for WhatsApp (must include country code)
      const formattedTo = to.startsWith('+') ? `whatsapp:${to}` : `whatsapp:+1${to.replace(/\D/g, '')}`;
      const fromWhatsApp = `whatsapp:${this.whatsappNumber}`;

      const messageData: any = {
        body: message,
        from: fromWhatsApp,
        to: formattedTo
      };

      // Add media if provided
      if (mediaUrl) {
        messageData.mediaUrl = [mediaUrl];
      }

      const messageResponse = await this.client.messages.create(messageData);

      console.log('✅ WhatsApp message sent successfully via Twilio');
      return {
        success: true,
        messageId: messageResponse.sid,
        status: messageResponse.status,
        to: formattedTo,
        from: fromWhatsApp,
        mediaUrl: mediaUrl || null
      };

    } catch (error: any) {
      console.error('❌ Twilio WhatsApp error:', error);
      throw new Error(`Failed to send WhatsApp message: ${error.message}`);
    }
  }

  async getMessageStatus(messageId: string): Promise<any> {
    try {
      const message = await this.client.messages(messageId).fetch();
      
      return {
        messageId: message.sid,
        status: message.status,
        to: message.to,
        from: message.from,
        dateSent: message.dateSent,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage
      };

    } catch (error: any) {
      console.error('❌ Error fetching message status:', error);
      throw new Error(`Failed to get message status: ${error.message}`);
    }
  }

  // Test connection by sending a test message
  async testConnection(): Promise<boolean> {
    try {
      // Send a test SMS to the WhatsApp number (to yourself)
      const testNumber = this.whatsappNumber.replace('whatsapp:', '');
      
      await this.sendSMS({
        to: testNumber,
        message: 'Practice Flow Backend - SMS Test: Twilio integration is working correctly!'
      });
      
      return true;
    } catch (error) {
      console.error('Twilio connection test failed:', error);
      return false;
    }
  }

  // Validate phone number format
  validatePhoneNumber(phoneNumber: string): { isValid: boolean; formatted: string } {
    // Remove all non-digit characters
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    
    // Check if it's a valid US number (10 digits) or international (11+ digits)
    if (digitsOnly.length === 10) {
      return { isValid: true, formatted: `+1${digitsOnly}` };
    } else if (digitsOnly.length >= 11) {
      return { isValid: true, formatted: `+${digitsOnly}` };
    }
    
    return { isValid: false, formatted: phoneNumber };
  }
}

export default TwilioService;