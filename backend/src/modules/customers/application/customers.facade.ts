import { Injectable } from '@nestjs/common';

export interface CustomerSummaryDto {
  id: string;
  name: string;
  email: string;
  company?: string | null;
}

@Injectable()
export class CustomersFacade {
  async getCustomerById(id: string): Promise<CustomerSummaryDto | null> {
    return null;
  }
}
