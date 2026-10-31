import { NotFoundException } from '@nestjs/common';

export class CustomerScope {
  /**
   * Asserts that if the caller has the CUSTOMER role, they may only access their own customer record.
   * If they attempt to access another customer's ID, returns 404 Not Found (anti-enumeration).
   */
  public static assertAccess(
    callerRole: string,
    callerCustomerId: string | null | undefined,
    targetCustomerId: string,
  ): void {
    if (callerRole === 'ADMIN' || callerRole === 'STAFF') {
      return;
    }

    if (callerRole === 'CUSTOMER') {
      if (!callerCustomerId || callerCustomerId !== targetCustomerId) {
        throw new NotFoundException('Customer resource not found');
      }
    }
  }
}
