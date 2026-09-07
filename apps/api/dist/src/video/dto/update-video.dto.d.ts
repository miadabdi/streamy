import { CreateVideoDto } from './create-video.dto';
declare const UpdateVideoDto_base: import('@nestjs/common').Type<
	Omit<Partial<CreateVideoDto>, 'channelId'>
>;
export declare class UpdateVideoDto extends UpdateVideoDto_base {
	id: number;
}
export {};
