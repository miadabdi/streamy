import { IsString } from 'class-validator';

export class OnPlayDto {
	@IsString()
	server_id: string;

	@IsString()
	service_id: string;

	@IsString()
	action: string;

	@IsString()
	client_id: string;

	@IsString()
	ip: string;

	@IsString()
	vhost: string;

	@IsString()
	app: string;

	@IsString()
	tcUrl: string;

	@IsString()
	stream: string;

	@IsString()
	param: string;

	@IsString()
	stream_url: string;

	@IsString()
	stream_id: string;

	@IsString()
	pageUrl: string;
}
