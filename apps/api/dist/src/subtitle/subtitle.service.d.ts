import { DrizzleService } from '../drizzle/drizzle.service';
import { Subtitle, User } from '../drizzle/schema';
import { FileService } from '../file/file.service';
import { VideoService } from '../video/video.service';
import { CreateSubtitleDto, DeleteSubtitleDto, UpdateSubtitleDto } from './dto';
export declare class SubtitleService {
	private drizzleService;
	private fileService;
	private videoService;
	private logger;
	constructor(drizzleService: DrizzleService, fileService: FileService, videoService: VideoService);
	userOwnsSubtitle(id: number, user: User): Promise<undefined>;
	createSubtitle(
		createSubtitleDto: CreateSubtitleDto,
		file: Express.Multer.File,
		user: User,
	): Promise<Subtitle>;
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
	getSubtitlesByVideoId(videoId: number): Promise<Subtitle[]>;
	getLanguageOfRFC5646(identifier: string): {
		language: string;
	};
	getSubtitleById(id: number): Promise<Subtitle>;
	deleteSubtitle(
		deleteSubtitleDto: DeleteSubtitleDto,
		user: User,
	): Promise<{
		message: string;
	}>;
}
