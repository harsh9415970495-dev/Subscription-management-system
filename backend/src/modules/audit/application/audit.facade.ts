import { Injectable } from '@nestjs/common';

export interface AuditLogEntryDto {
  actor: string;
  action: string;
  entityName: string;
  entityId: string;
  details?: Record<string, unknown>;
}

@Injectable()
export class AuditFacade {
  async record(entry: AuditLogEntryDto): Promise<void> {
    // Append-only audit record
  }
}
