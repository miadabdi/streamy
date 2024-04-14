import {
	ValidationArguments,
	ValidatorConstraint,
	ValidatorConstraintInterface,
} from 'class-validator';

export enum DependentFieldsOperation {
	NotEquel,
}

@ValidatorConstraint({ name: 'dependentFields', async: false })
export class DependentFields implements ValidatorConstraintInterface {
	validate(value: any, args: ValidationArguments) {
		const operation: DependentFieldsOperation = args.constraints[0];
		const dependentField: string = args.constraints[1];

		if (operation == DependentFieldsOperation.NotEquel) {
			if (value === args.object[dependentField]) return false;
		}

		return true;

		// for async validations you must return a Promise<boolean> here
	}

	defaultMessage(args: ValidationArguments) {
		// here you can provide default error message if validation failed
		return 'Default Message, Value: ($value)';
	}
}
