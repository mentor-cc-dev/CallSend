export interface SendSmsParams {
  phoneNumber: string;
  message: string;
}

export interface SendSmsResult {
  success: boolean;
  messageId?: string;
  provider: string;
  error?: string;
}

export interface ISmsProvider {
  sendSms(params: SendSmsParams): Promise<SendSmsResult>;
  getBalance?(): Promise<{ balance: number; currency: string }>;
}
