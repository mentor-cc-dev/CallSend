import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ISmsProvider, SendSmsParams, SendSmsResult } from './sms-provider.interface';

@Injectable()
export class EskizSmsProvider implements ISmsProvider {
  private readonly logger = new Logger('EskizSmsProvider');
  private readonly baseUrl = 'https://notify.eskiz.uz/api';
  private authToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(
    private readonly email: string,
    private readonly password: string,
  ) {}

  private async getAuthToken(): Promise<string> {
    const now = Date.now();
    if (this.authToken && now < this.tokenExpiresAt) {
      return this.authToken;
    }

    try {
      const response = await axios.post(`${this.baseUrl}/auth/login`, {
        email: this.email,
        password: this.password,
      });

      if (response.data && response.data.data && response.data.data.token) {
        this.authToken = response.data.data.token;
        // Token is typically valid for 30 days, cache for 29 days
        this.tokenExpiresAt = now + 29 * 24 * 60 * 60 * 1000;
        this.logger.log('Eskiz.uz token successfully refreshed');
        return this.authToken;
      }
      throw new Error('Invalid authentication response from Eskiz');
    } catch (error) {
      this.logger.error(`Eskiz Auth failed: ${error?.message || error}`);
      throw error;
    }
  }

  async sendSms(params: SendSmsParams): Promise<SendSmsResult> {
    try {
      const token = await this.getAuthToken();
      // Format phone number: remove '+' if present, Eskiz expects e.g. 998901234567
      const cleanPhone = params.phoneNumber.replace(/\D/g, '');

      const response = await axios.post(
        `${this.baseUrl}/message/sms/send`,
        {
          mobile_phone: cleanPhone,
          message: params.message,
          from: '4546', // Default system sender or tenant nickname
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      return {
        success: true,
        messageId: response.data?.id?.toString() || 'eskiz_ok',
        provider: 'ESKIZ',
      };
    } catch (error) {
      this.logger.error(`Failed to send SMS via Eskiz: ${error?.response?.data?.message || error.message}`);
      return {
        success: false,
        provider: 'ESKIZ',
        error: error?.response?.data?.message || error.message,
      };
    }
  }

  async getBalance() {
    try {
      const token = await this.getAuthToken();
      const response = await axios.get(`${this.baseUrl}/user/get-limit`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return {
        balance: response.data?.data?.balance || 0,
        currency: 'SMS_UNITS',
      };
    } catch (error) {
      this.logger.error('Failed to get Eskiz balance', error);
      return { balance: 0, currency: 'UNKNOWN' };
    }
  }
}
