import { Injectable, Logger } from '@nestjs/common';
import { ISmsProvider, SendSmsParams, SendSmsResult } from './sms-provider.interface';

@Injectable()
export class MockSmsProvider implements ISmsProvider {
  private readonly logger = new Logger('MockSmsProvider');

  async sendSms(params: SendSmsParams): Promise<SendSmsResult> {
    this.logger.log(`\n================== [MOCK SMS SENT] ==================`);
    this.logger.log(`TO: ${params.phoneNumber}`);
    this.logger.log(`TEXT: ${params.message}`);
    this.logger.log(`====================================================\n`);

    return {
      success: true,
      messageId: `mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      provider: 'MOCK_SANDBOX',
    };
  }

  async getBalance() {
    return {
      balance: 9999,
      currency: 'UZS',
    };
  }
}
