import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsStrongPassword } from 'class-validator';
import { Match } from 'src/common/decorators/match.decorator';
import { IsNotPwned } from 'src/common/validators/is-not-pwned.validator';

export class updatePasswordDto {
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
  oldPassword: string;

  @ApiProperty({ example: 'Password@123', minLength: 8 })
  @IsNotEmpty()
  @IsString()
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
  confirmNewPassword: string;
}
