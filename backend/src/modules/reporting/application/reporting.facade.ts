import { Injectable } from '@nestjs/common';

export interface DashboardMetricsDto {
  activeSubscriptionsCount: number;
  mrrPaise: bigint;
  totalInvoicedPaise: bigint;
  totalCollectedPaise: bigint;
  totalOutstandingPaise: bigint;
  overdueCount: number;
}

@Injectable()
export class ReportingFacade {
  async getDashboardMetrics(): Promise<DashboardMetricsDto> {
    return {
      activeSubscriptionsCount: 0,
      mrrPaise: 0n,
      totalInvoicedPaise: 0n,
      totalCollectedPaise: 0n,
      totalOutstandingPaise: 0n,
      overdueCount: 0,
    };
  }
}
