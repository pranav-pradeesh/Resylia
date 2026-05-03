import { Client } from '@microsoft/microsoft-graph-client';

/**
 * Microsoft 365 integration service for Calendar and Outlook
 */
export class Microsoft365Service {
  private client: Client | null = null;

  constructor() {
    // Initialize Microsoft Graph client
    // In a real implementation, you would handle token acquisition and refresh
    // This is a simplified version for demonstration
  }

  /**
   * Initialize the Microsoft Graph client with an access token
   * @param accessToken Valid Microsoft Graph access token
   */
  initialize(accessToken: string): void {
    this.client = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      }
    });
  }

  /**
   * Get events from the user's calendar for a specific date range
   * @param startDateTime Start of the date range (ISO string)
   * @param endDateTime End of the date range (ISO string)
   * @returns Promise resolving to calendar events
   */
  async getCalendarEvents(startDateTime: string, endDateTime: string): Promise<any[]> {
    if (!this.client) {
      throw new Error('Microsoft 365 client not initialized');
    }

    try {
      const response = await this.client
        .api('/me/calendar/events')
        .filter(`start/dateTime ge '${startDateTime}' and end/dateTime le '${endDateTime}'`)
        .select('subject,start,end,bodyPreview,location')
        .top(50)
        .get();

      return response.value;
    } catch (error) {
      console.error('Failed to fetch calendar events:', error);
      throw new Error(`Failed to fetch calendar events: ${error.message}`);
    }
  }

  /**
   * Create a calendar event
   * @param eventDetails Event details to create
   * @returns Promise resolving to the created event
   */
  async createCalendarEvent(eventDetails: {
    subject: string;
    start: { dateTime: string; timeZone: string };
    end: { dateTime: string; timeZone: string };
    body?: { contentType: string; content: string };
    location?: { displayName: string };
  }): Promise<any> {
    if (!this.client) {
      throw new Error('Microsoft 365 client not initialized');
    }

    try {
      const response = await this.client
        .api('/me/calendar/events')
        .post(eventDetails);

      return response;
    } catch (error) {
      console.error('Failed to create calendar event:', error);
      throw new Error(`Failed to create calendar event: ${error.message}`);
    }
  }

  /**
   * Send an email via Outlook
   * @param emailDetails Email details to send
   * @returns Promise resolving when email is sent
   */
  async sendEmail(emailDetails: {
    subject: string;
    body: { contentType: string; content: string };
    toRecipients: Array<{ emailAddress: { address: string; name: string } }>;
  }): Promise<void> {
    if (!this.client) {
      throw new Error('Microsoft 365 client not initialized');
    }

    try {
      await this.client
        .api('/me/sendMail')
        .post({ message: emailDetails, saveToSentItems: 'true' });
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Get user profile information
   * @returns Promise resolving to user profile
   */
  async getUserProfile(): Promise<any> {
    if (!this.client) {
      throw new Error('Microsoft 365 client not initialized');
    }

    try {
      const response = await this.client
        .api('/me')
        .select('displayName,mail,userPrincipalName')
        .get();

      return response;
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      throw new Error(`Failed to fetch user profile: ${error.message}`);
    }
  }
}

// Export a singleton instance for use throughout the application
export const microsoft365Service = new Microsoft365Service();