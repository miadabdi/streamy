import { User } from '../drizzle/schema';
import {
	CreateSubtitleDto,
	DeleteSubtitleDto,
	GetSubtitleByIdDto,
	GetSubtitleByVideoIdDto,
	UpdateSubtitleDto,
} from './dto';
import { SubtitleService } from './subtitle.service';
export declare class SubtitleController {
	private subtitleService;
	constructor(subtitleService: SubtitleService);
	createSubtitle(
		createSubtitleDto: CreateSubtitleDto,
		file: Express.Multer.File,
		user: User,
	): Promise<{
		id: number;
		langRFC5646: string;
		videoId: number;
		createdAt: Date;
		updatedAt: Date;
		isActive: boolean;
		deletedAt: Date;
		fileId: number;
	}>;
	updateSubtitle(
		updateSubtitleDto: UpdateSubtitleDto,
		user: User,
	): Promise<{
		id: number;
		createdAt: Date;
		updatedAt: Date;
		isActive: boolean;
		deletedAt: Date;
		langRFC5646: string;
		videoId: number;
		fileId: number;
	}>;
	getSubtitleById(
		getSubtitleByIdDto: GetSubtitleByIdDto,
		user: User,
	): Promise<{
		id: number;
		langRFC5646: string;
		videoId: number;
		createdAt: Date;
		updatedAt: Date;
		isActive: boolean;
		deletedAt: Date;
		fileId: number;
	}>;
	getLanguageOfRFC5646(
		identifier: string,
		user: User,
	): {
		language: string;
	};
	getSubtitleByVideoId(
		getSubtitleByVideoIdDto: GetSubtitleByVideoIdDto,
		user: User,
	): Promise<
		{
			id: number;
			langRFC5646: string;
			videoId: number;
			createdAt: Date;
			updatedAt: Date;
			isActive: boolean;
			deletedAt: Date;
			fileId: number;
		}[]
	>;
	deleteSubtitle(
		deleteSubtitleDto: DeleteSubtitleDto,
		user: User,
	): Promise<{
		message: string;
	}>;
}
