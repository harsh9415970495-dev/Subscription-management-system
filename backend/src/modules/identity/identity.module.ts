import { Module } from '@nestjs/common';
import { AuditModule } from '../audit';
import { CustomersModule } from '../customers';
import { AuthController } from './api/auth.controller';
import { StaffController } from './api/staff.controller';
import { AuthService } from './application/auth.service';
import { IdentityFacade } from './application/identity.facade';
import { PasswordHasher } from './application/password-hasher.service';

@Module({
  imports: [CustomersModule, AuditModule],
  controllers: [AuthController, StaffController],
  providers: [
    AuthService,
    PasswordHasher,
    IdentityFacade,
  ],
  exports: [IdentityFacade],
})
export class IdentityModule {}
