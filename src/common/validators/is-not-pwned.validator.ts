import 'dotenv/config';
import { Logger } from '@nestjs/common';
import {
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
} from 'class-validator';
import * as crypto from 'crypto';
@ValidatorConstraint({ name: 'isNotPwned', async: true })
export class IsNotPwnedConstraint implements ValidatorConstraintInterface {
  private readonly logger = new Logger(IsNotPwnedConstraint.name);

  async validate(
    password: string,
    args: ValidationArguments,
  ): Promise<boolean> {
    if (!password) return false;

    try {
      const hash = crypto
        .createHash('256')
        .update(password)
        .digest('hex')
        .toUpperCase();
      const prefix = hash.slice(0, 5);
      const suffix = hash.slice(5);
      const url =
        process.env.HIBP_URL || 'https://api.pwnedpasswords.com/range';
      const userAgent = process.env.USER_AGENT || 'MyNestApp';

      const response = await fetch(`${url}/${prefix}`, {
        headers: {
          'User-Agent': userAgent,
        },
      });
      if (!response.ok) {
        this.logger.error(
          `HIBP API check failed with status: ${response.status}`,
        );
        return true;
      }
      const text = await response.text();
      const isPwned = text.split('\r\n').some((line) => {
        const [hashSuffix] = line.split(':');
        return hashSuffix === suffix;
      });
      return !isPwned;
    } catch (error) {
      this.logger.error(`Password pwned check error: ${error.message}`);
      return true;
    }
  }
  defaultMessage(args: ValidationArguments): string {
    return 'This password has appeared in a data breach. Please use a different password.';
  }
}

export function IsNotPwned(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsNotPwnedConstraint,
    });
  };
}
