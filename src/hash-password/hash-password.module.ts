import { Module } from '@nestjs/common';
import { HashPasswordService } from './hash-password.service';
import { HashPasswordController } from './hash-password.controller';

@Module({
  providers: [HashPasswordService],
  controllers: [HashPasswordController],
  exports: [HashPasswordService],
})
export class HashPasswordModule {}
