import { Injectable } from '@nestjs/common';

export interface EmailDispatchDto {
  to: string;
  subject: string;
  template: string;
  data: Record<string, unknown>;
  attachments?: Array<{ filename: string; content: Buffer }>;
}

@Injectable()
export class NotificationsFacade {
  async sendEmail(dto: EmailDispatchDto): Promise<void> {
    // Scaffolded for Phase 1 (reset links) and Phase 5 (invoices)
  }
}
