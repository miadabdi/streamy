import { CreateCommentDto } from './create-comment.dto';
declare const UpdateCommentDto_base: import('@nestjs/common').Type<
	Omit<Partial<CreateCommentDto>, 'videoId' | 'replyTo'>
>;
export declare class UpdateCommentDto extends UpdateCommentDto_base {
	id: number;
}
export {};
