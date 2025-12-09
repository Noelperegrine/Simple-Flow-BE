import fetch from 'node-fetch';

interface SMSData {
  to: string;
  message: string;
  from?: string;
}

class TermiiService {
  private apiKey: string;
  private baseUrl: string;
  private senderId: string;

  constructor() {
    const apiKey = process.env.TERMII_API_KEY;
    const senderId = process.env.TERMII_SENDER_ID || 'PracticeFlow';

    if (!apiKey) {
      throw new Error('Termii API key is required');
    }

    this.apiKey = apiKey;
    this.baseUrl = 'https://api.ng.termii.com/api';
    this.senderId = senderId;
  }

  /**
   * Send SMS using Termii
   * @param smsData SMS data including recipient and message
   */
  async sendSMS(smsData: SMSData): Promise<any> {
    try {
      const { to, message, from } = smsData;
      
      // Clean phone number (remove spaces, dashes, etc.)
      const cleanPhoneNumber = this.formatPhoneNumber(to);
      
      const payload = {
        to: cleanPhoneNumber,
        from: from || this.senderId,
        sms: message,
        type: 'plain',
        channel: 'generic',
        api_key: this.apiKey
      };

      const response = await fetch(`${this.baseUrl}/sms/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json() as any;

      if (!response.ok) {
        throw new Error(`Termii API Error: ${result.message || 'Unknown error'}`);
      }

      console.log('✅ SMS sent successfully via Termii');
      return {
        messageId: result.message_id,
        status: result.message,
        balance: result.balance,
        cost: result.sms_count
      };
    } catch (error: any) {
      console.error('❌ Termii SMS error:', error);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  /**
   * Send OTP using Termii
   * @param phoneNumber Recipient phone number
   * @param pinType Type of OTP (NUMERIC, ALPHANUMERIC)
   * @param pinLength Length of OTP (4-8 digits)
   */
  async sendOTP(phoneNumber: string, pinType: 'NUMERIC' | 'ALPHANUMERIC' = 'NUMERIC', pinLength: number = 6): Promise<any> {
    try {
      const cleanPhoneNumber = this.formatPhoneNumber(phoneNumber);
      
      const payload = {
        api_key: this.apiKey,
        message_type: 'NUMERIC',
        to: cleanPhoneNumber,
        from: this.senderId,
        channel: 'generic',
        pin_attempts: 3,
        pin_time_to_live: 5,
        pin_length: pinLength,
        pin_placeholder: '< 1234 >',
        message_text: `Your verification code is < 1234 >. Valid for 5 minutes.`,
        pin_type: pinType
      };

      const response = await fetch(`${this.baseUrl}/sms/otp/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json() as any;

      if (!response.ok) {
        throw new Error(`Termii OTP Error: ${result.message || 'Unknown error'}`);
      }

      console.log('✅ OTP sent successfully via Termii');
      return {
        pinId: result.pinId,
        to: result.to,
        message: result.message || 'OTP sent successfully',
        smsStatus: result.smsStatus,
        status: result.status
      };
    } catch (error: any) {
      console.error('❌ Termii OTP error:', error);
      throw new Error(`Failed to send OTP: ${error.message}`);
    }
  }

  /**
   * Verify OTP using Termii
   * @param pinId Pin ID from OTP send response
   * @param pin OTP code to verify
   */
  async verifyOTP(pinId: string, pin: string): Promise<any> {
    try {
      const payload = {
        api_key: this.apiKey,
        pin_id: pinId,
        pin: pin
      };

      const response = await fetch(`${this.baseUrl}/sms/otp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json() as any;

      if (!response.ok) {
        throw new Error(`Termii Verify Error: ${result.message || 'Unknown error'}`);
      }

      return {
        pinId: result.pinId,
        verified: result.verified === 'True',
        status: result.msisdn
      };
    } catch (error: any) {
      console.error('❌ Termii verify error:', error);
      throw new Error(`Failed to verify OTP: ${error.message}`);
    }
  }

  /**
   * Get account balance
   */
  async getBalance(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/get-balance?api_key=${this.apiKey}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Check if response is empty or not OK
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Termii Balance Error (${response.status}): ${errorText || 'Unknown error'}`);
      }

      const text = await response.text();
      if (!text.trim()) {
        throw new Error('Empty response from Termii API');
      }

      const result = JSON.parse(text);

      return {
        balance: result.balance,
        currency: result.currency,
        user: result.user
      };
    } catch (error: any) {
      console.error('❌ Termii balance error:', error);
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  /**
   * Test connection by checking balance
   */
  async testConnection(): Promise<boolean> {
    try {
      // Simple test - just check if API key works
      const response = await fetch(`${this.baseUrl}/get-balance?api_key=${this.apiKey}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok && response.status === 200) {
        console.log('✅ Termii connection successful');
        return true;
      } else {
        console.log('❌ Termii connection failed: HTTP', response.status);
        return false;
      }
    } catch (error: any) {
      console.log('❌ Termii connection failed:', error.message);
      return false;
    }
  }

  /**
   * Format phone number for international format
   * @param phoneNumber Raw phone number
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-numeric characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // If number starts with 0, assume it's Nigerian and replace with +234
    if (cleaned.startsWith('0')) {
      cleaned = '234' + cleaned.substring(1);
    }
    
    // If doesn't start with country code, assume Nigerian
    if (!cleaned.startsWith('234') && cleaned.length === 10) {
      cleaned = '234' + cleaned;
    }
    
    return cleaned;
  }
}

export default TermiiService;