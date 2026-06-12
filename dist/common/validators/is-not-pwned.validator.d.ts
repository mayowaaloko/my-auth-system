import 'dotenv/config';
import { ValidationOptions, ValidationArguments, ValidatorConstraintInterface } from 'class-validator';
export declare class IsNotPwnedConstraint implements ValidatorConstraintInterface {
    private readonly logger;
    validate(password: string, args: ValidationArguments): Promise<boolean>;
    defaultMessage(args: ValidationArguments): string;
}
export declare function IsNotPwned(validationOptions?: ValidationOptions): (object: Object, propertyName: string) => void;
