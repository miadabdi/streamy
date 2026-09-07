import { CreateChannelDto } from './create-channel.dto';
declare const UpdateChannelDto_base: import('@nestjs/common').Type<Partial<CreateChannelDto>>;
export declare class UpdateChannelDto extends UpdateChannelDto_base {
	id: number;
	avatarFileId: number;
}
export {};
