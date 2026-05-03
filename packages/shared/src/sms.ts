import twilio from 'twilio';

/**
 * Messaging service for sending SMS and WhatsApp notifications
 */
export class MessagingService {
  private client: twilio.Twilio;
  private fromNumber: string;
  private whatsappFrom: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_FROM_NUMBER!;
    this.whatsappFrom = process.env.TWILIO_WHATSAPP_FROM! || 'whatsapp:+14155238886'; // Twilio's sandbox number

    if (!accountSid || !authToken || !this.fromNumber) {
      throw new Error('Twilio credentials are required');
    }

    this.client = twilio(accountSid, authToken);
  }

  /**
   * Send an SMS message
   * @param to Recipient phone number
   * @param body Message content
   * @returns Promise that resolves when message is sent
   */
  async sendSMS(to: string, body: string): Promise<void> {
    try {
      await this.client.messages.create({
        body,
        from: this.fromNumber,
        to
      });
    } catch (error) {
      console.error('Failed to send SMS:', error);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  /**
   * Send a WhatsApp message
   * @param to Recipient WhatsApp number (format: whatsapp:+1234567890)
   * @param body Message content
   * @returns Promise that resolves when message is sent
   */
  async sendWhatsApp(to: string, body: string): Promise<void> {
    try {
      await this.client.messages.create({
        body,
        from: this.whatsappFrom,
        to: `whatsapp:${to.replace('whatsapp:', '')}`
      });
    } catch (error) {
      console.error('Failed to send WhatsApp message:', error);
      throw new Error(`Failed to send WhatsApp message: ${error.message}`);
    }
  }

  /**
   * Send a check-in reminder to a user via SMS
   * @param phoneNumber User's phone number
   * @param userName User's name for personalization
   * @returns Promise that resolves when reminder is sent
   */
  async sendCheckinReminder(phoneNumber: string, userName: string): Promise<void> {
    const body = `Hi ${userName}, it's time for your daily Resylia check-in! Take 30 seconds to rate your energy, stress, and workload. Your wellbeing matters.`;
    await this.sendSMS(phoneNumber, body);
  }

  /**
   * Send a check-in reminder to a user via WhatsApp
   * @param whatsappNumber User's WhatsApp number
   * @param userName User's name for personalization
   * @returns Promise that resolves when reminder is sent
   */
  async sendCheckinReminderViaWhatsApp(whatsappNumber: string, userName: string): Promise<void> {
    const body = `Hi ${userName}, it's time for your daily Resylia check-in! Take 30 seconds to rate your energy, stress, and workload. Your wellbeing matters.`;
    await this.sendWhatsApp(whatsappNumber, body);
  }

  /**
   * Send a weekly summary to a manager via SMS
   * @param phoneNumber Manager's phone number
   * @param managerName Manager's name for personalization
   * @param teamSummary Summary of team's wellbeing data
   * @returns Promise that resolves when summary is sent
   */
  async sendWeeklySummary(phoneNumber: string, managerName: string, teamSummary: string): Promise<void> {
    const body = `Hi ${managerName}, here's your weekly team wellbeing summary:\n\n${teamSummary}\n\nView full dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/manager/dashboard`;
    await this.sendSMS(phoneNumber, body);
  }

  /**
   * Send a weekly summary to a manager via WhatsApp
   * @param whatsappNumber Manager's WhatsApp number
   * @param managerName Manager's name for personalization
   * @param teamSummary Summary of team's wellbeing data
   * @returns Promise that resolves when summary is sent
   */
  async sendWeeklySummaryViaWhatsApp(whatsappNumber: string, managerName: string, teamSummary: string): Promise<void> {
    const body = `Hi ${managerName}, here's your weekly team wellbeing summary:\n\n${teamSummary}\n\nView full dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/manager/dashboard`;
    await this.sendWhatsApp(whatsappNumber, body);
  }

  /**
   * Send a high risk alert to a manager via SMS
   * @param phoneNumber Manager's phone number
   * @param managerName Manager's name for personalization
   * @param userName Name of team member at risk
   * @param riskLevel Risk level (high/critical)
   * @returns Promise that resolves when alert is sent
   */
  async sendHighRiskAlert(
    phoneNumber: string,
    managerName: string,
    userName: string,
    riskLevel: 'high' | 'critical'
  ): Promise<void> {
    const body = `ALERT: ${userName} has been identified as having ${riskLevel} burnout risk. Please check in with them and offer support. View details: ${process.env.NEXT_PUBLIC_APP_URL}/manager/alerts`;
    await this.sendSMS(phoneNumber, body);
  }

  /**
   * Send a high risk alert to a manager via WhatsApp
   * @param whatsappNumber Manager's WhatsApp number
   * @param managerName Manager's name for personalization
   * @param userName Name of team member at risk
   * @param riskLevel Risk level (high/critical)
   * @returns Promise that resolves when alert is sent
   */
  async sendHighRiskAlertViaWhatsApp(
    whatsappNumber: string,
    managerName: string,
    userName: string,
    riskLevel: 'high' | 'critical'
  ): Promise<void> {
    const body = `ALERT: ${userName} has been identified as having ${riskLevel} burnout risk. Please check in with them and offer support. View details: ${process.env.NEXT_PUBLIC_APP_URL}/manager/alerts`;
    await this.sendWhatsApp(whatsappNumber, body);
  }
}

// Export a singleton instance for use throughout the application
export const messagingService = new MessagingService();