import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { HashPasswordModule } from 'src/hash-password/hash-password.module';
import { EmailModule } from 'src/email/email.module';
import { RefreshTokenModule } from 'src/refresh-token/refresh-token.module';
@Module({
  imports: [
    UsersModule,
    JwtModule.register({}),
    HashPasswordModule,
    EmailModule,
    RefreshTokenModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
