import { ValidationArguments, ValidatorConstraintInterface } from 'class-validator';
export declare enum DependentFieldsOperation {
	NotEquel = 0,
}
export declare class DependentFields implements ValidatorConstraintInterface {
	validate(value: any, args: ValidationArguments): boolean;
	defaultMessage(args: ValidationArguments): string;
}
