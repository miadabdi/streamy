export declare const BUCKETS: readonly [
	{
		readonly name: 'images';
		readonly policy: {
			readonly Version: '2012-10-17';
			readonly Statement: readonly [
				{
					readonly Sid: 'PublicRead';
					readonly Effect: 'Allow';
					readonly Principal: '*';
					readonly Action: readonly ['s3:GetObject', 's3:GetObjectVersion'];
					readonly Resource: readonly ['arn:aws:s3:::images/*'];
				},
			];
		};
		readonly allowedMimeTypes: readonly [
			'image/apng',
			'image/avif',
			'image/gif',
			'image/jpeg',
			'image/png',
			'image/webp',
		];
	},
	{
		readonly name: 'hls';
		readonly policy: {
			readonly Version: '2012-10-17';
			readonly Statement: readonly [
				{
					readonly Sid: 'PublicRead';
					readonly Effect: 'Allow';
					readonly Principal: '*';
					readonly Action: readonly ['s3:GetObject', 's3:GetObjectVersion'];
					readonly Resource: readonly ['arn:aws:s3:::hls/*'];
				},
			];
		};
		readonly allowedMimeTypes: readonly [
			'text/plain',
			'video/mp4',
			'video/mpeg',
			'video/mp2t',
			'video/webm',
			'video/x-matroska',
			'application/octet-stream',
		];
	},
	{
		readonly name: 'videos';
		readonly policy: {
			readonly Version: '2012-10-17';
			readonly Statement: readonly [
				{
					readonly Sid: 'PublicRead';
					readonly Effect: 'Allow';
					readonly Principal: '*';
					readonly Action: readonly ['s3:GetObject', 's3:GetObjectVersion'];
					readonly Resource: readonly ['arn:aws:s3:::videos/*'];
				},
			];
		};
		readonly allowedMimeTypes: readonly [
			'video/mp4',
			'video/mpeg',
			'video/mp2t',
			'video/webm',
			'video/x-matroska',
			'application/octet-stream',
		];
	},
	{
		readonly name: 'channelavatars';
		readonly policy: {
			readonly Version: '2012-10-17';
			readonly Statement: readonly [
				{
					readonly Sid: 'PublicRead';
					readonly Effect: 'Allow';
					readonly Principal: '*';
					readonly Action: readonly ['s3:GetObject', 's3:GetObjectVersion'];
					readonly Resource: readonly ['arn:aws:s3:::channelavatars/*'];
				},
			];
		};
		readonly allowedMimeTypes: readonly [
			'image/apng',
			'image/avif',
			'image/gif',
			'image/jpeg',
			'image/png',
			'image/webp',
		];
	},
	{
		readonly name: 'videothumbnails';
		readonly policy: {
			readonly Version: '2012-10-17';
			readonly Statement: readonly [
				{
					readonly Sid: 'PublicRead';
					readonly Effect: 'Allow';
					readonly Principal: '*';
					readonly Action: readonly ['s3:GetObject', 's3:GetObjectVersion'];
					readonly Resource: readonly ['arn:aws:s3:::videothumbnails/*'];
				},
			];
		};
		readonly allowedMimeTypes: readonly [
			'image/apng',
			'image/avif',
			'image/gif',
			'image/jpeg',
			'image/png',
			'image/webp',
		];
	},
	{
		readonly name: 'subtitlefiles';
		readonly policy: {
			readonly Version: '2012-10-17';
			readonly Statement: readonly [
				{
					readonly Sid: 'PublicRead';
					readonly Effect: 'Allow';
					readonly Principal: '*';
					readonly Action: readonly ['s3:GetObject', 's3:GetObjectVersion'];
					readonly Resource: readonly ['arn:aws:s3:::subtitlefiles/*'];
				},
			];
		};
		readonly allowedMimeTypes: readonly [
			'text/plain',
			'application/x-subrip',
			'application/octet-stream',
		];
	},
	{
		readonly name: 'public';
		readonly policy: {
			readonly Version: '2012-10-17';
			readonly Statement: readonly [
				{
					readonly Sid: 'PublicRead';
					readonly Effect: 'Allow';
					readonly Principal: '*';
					readonly Action: readonly ['s3:GetObject', 's3:GetObjectVersion'];
					readonly Resource: readonly ['arn:aws:s3:::public/*'];
				},
			];
		};
		readonly allowedMimeTypes: readonly [
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
		];
	},
];
export declare const BUCKET_NAMES: (
	| 'videos'
	| 'public'
	| 'images'
	| 'hls'
	| 'channelavatars'
	| 'videothumbnails'
	| 'subtitlefiles'
)[];
export type BUCKET_NAMES_TYPE = (typeof BUCKET_NAMES)[number];
