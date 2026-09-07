export const BUCKETS = [
	{
		name: 'images',
		policy: {
			Version: '2012-10-17',
			Statement: [
				{
					Sid: 'PublicRead',
					Effect: 'Allow',
					Principal: '*',
					Action: ['s3:GetObject', 's3:GetObjectVersion'],
					Resource: [`arn:aws:s3:::images/*`],
				},
			],
		},
		allowedMimeTypes: [
			'image/apng',
			'image/avif',
			'image/gif',
			'image/jpeg',
			'image/png',
			'image/webp',
		],
	},
	{
		name: 'hls',
		policy: {
			Version: '2012-10-17',
			Statement: [
				{
					Sid: 'PublicRead',
					Effect: 'Allow',
					Principal: '*',
					Action: ['s3:GetObject', 's3:GetObjectVersion'],
					Resource: [`arn:aws:s3:::hls/*`],
				},
			],
		},
		allowedMimeTypes: [
			'text/plain',
			'video/mp4',
			'video/mpeg',
			'video/mp2t',
			'video/webm',
			'video/x-matroska',
			'application/octet-stream',
		],
	},
	{
		name: 'videos',
		policy: {
			Version: '2012-10-17',
			Statement: [
				{
					Sid: 'PublicRead',
					Effect: 'Allow',
					Principal: '*',
					Action: ['s3:GetObject', 's3:GetObjectVersion'],
					Resource: [`arn:aws:s3:::videos/*`],
				},
			],
		},
		allowedMimeTypes: [
			'video/mp4',
			'video/mpeg',
			'video/mp2t',
			'video/webm',
			'video/x-matroska',
			'application/octet-stream',
		],
	},
	{
		name: 'channelavatars',
		policy: {
			Version: '2012-10-17',
			Statement: [
				{
					Sid: 'PublicRead',
					Effect: 'Allow',
					Principal: '*',
					Action: ['s3:GetObject', 's3:GetObjectVersion'],
					Resource: [`arn:aws:s3:::channelavatars/*`],
				},
			],
		},
		allowedMimeTypes: [
			'image/apng',
			'image/avif',
			'image/gif',
			'image/jpeg',
			'image/png',
			'image/webp',
		],
	},
	{
		name: 'videothumbnails',
		policy: {
			Version: '2012-10-17',
			Statement: [
				{
					Sid: 'PublicRead',
					Effect: 'Allow',
					Principal: '*',
					Action: ['s3:GetObject', 's3:GetObjectVersion'],
					Resource: [`arn:aws:s3:::videothumbnails/*`],
				},
			],
		},
		allowedMimeTypes: [
			'image/apng',
			'image/avif',
			'image/gif',
			'image/jpeg',
			'image/png',
			'image/webp',
		],
	},
	{
		name: 'subtitlefiles',
		policy: {
			Version: '2012-10-17',
			Statement: [
				{
					Sid: 'PublicRead',
					Effect: 'Allow',
					Principal: '*',
					Action: ['s3:GetObject', 's3:GetObjectVersion'],
					Resource: [`arn:aws:s3:::subtitlefiles/*`],
				},
			],
		},
		allowedMimeTypes: ['text/plain', 'application/x-subrip', 'application/octet-stream'],
	},
	{
		name: 'public',
		policy: {
			Version: '2012-10-17',
			Statement: [
				{
					Sid: 'PublicRead',
					Effect: 'Allow',
					Principal: '*',
					Action: ['s3:GetObject', 's3:GetObjectVersion'],
					Resource: [`arn:aws:s3:::public/*`],
				},
			],
		},
		allowedMimeTypes: [
			'image/apng',
			'image/avif',
			'image/gif',
			'image/jpeg',
			'image/png',
			'image/webp',
			'application/octet-stream',
			'text/plain',
			'text/css',
			'text/html',
			'text/javascript',
			'application/javascript',
		],
	},
] as const;
export const BUCKET_NAMES = BUCKETS.map((bucket) => bucket.name);
export type BUCKET_NAMES_TYPE = (typeof BUCKET_NAMES)[number];
