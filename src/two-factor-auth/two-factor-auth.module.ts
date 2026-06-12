import { Module } from '@nestjs/common';
import { TwoFactorAuthController } from './two-factor-auth.controller';
import { UsersModule } from 'src/users/users.module';
import { HashPasswordModule } from 'src/hash-password/hash-password.module';
import { TwoFactorAuthService } from './two-factor-auth.service';

@Module({
  imports: [UsersModule, HashPasswordModule],
  providers: [TwoFactorAuthService],
  controllers: [TwoFactorAuthController],
  exports: [TwoFactorAuthService],
})
export class TwoFactorAuthModule {}
