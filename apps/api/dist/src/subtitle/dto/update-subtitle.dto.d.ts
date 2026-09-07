import { CreateSubtitleDto } from './create-subtitle.dto';
declare const UpdateSubtitleDto_base: import('@nestjs/common').Type<
	Pick<Partial<CreateSubtitleDto>, 'langRFC5646'>
>;
export declare class UpdateSubtitleDto extends UpdateSubtitleDto_base {
	id: number;
}
export {};
