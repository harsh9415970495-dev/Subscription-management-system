import { Injectable } from '@nestjs/common';

export interface UserSummaryDto {
  id: string;
  email: string;
  role: 'ADMIN' | 'STAFF' | 'CUSTOMER';
  customerId?: string | null;
}

@Injectable()
export class IdentityFacade {
  async findUserById(userId: string): Promise<UserSummaryDto | null> {
    // Scaffolded for Phase 1
    return null;
  }
}
