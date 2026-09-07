import { Type } from 'class-transformer';
import { IsInt, Validate } from 'class-validator';
import {
	DependentFields,
	DependentFieldsOperation,
} from '../../common/helpers/validate-dependent-fields';

export class AddSubscriptionDto {
	@IsInt()
	@Type(() => Number)
	followerId: number;

	@Validate(DependentFields, [DependentFieldsOperation.NotEquel, 'followerId'], {
		message: `followerId and followeeId should not be the same`,
	})
	@IsInt()
	@Type(() => Number)
	followeeId: number;
}
