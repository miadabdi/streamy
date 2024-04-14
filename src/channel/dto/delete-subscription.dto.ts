import { OmitType } from '@nestjs/swagger';
import { AddSubscriptionDto } from './add-subscription.dto';

export class DeleteSubscriptionDto extends OmitType(AddSubscriptionDto, [] as const) {}
