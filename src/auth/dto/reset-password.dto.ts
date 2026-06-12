import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
} from 'class-validator';
import { Match } from '../../common/decorators/match.decorator';
import { IsNotPwned } from '../../common/validators/is-not-pwned.validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'Password@123', minLength: 8 })
  @IsString()
  @IsNotEmpty()
  @IsNotPwned()
  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    { message: 'please use a strong password' },
  )
  newPassword: string;

  @ApiProperty({ example: 'Password@123', minLength: 8 })
  @IsString()
  @IsNotEmpty()
  @IsNotPwned()
  @Match('newPassword', { message: 'Passwords do not match' })
  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    { message: 'please use a strong password' },
  )
  confirmPassword: string;
}
