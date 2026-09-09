/** PATCH /video/set-thumbnail multipart body — field name per FileInterceptor('thumbnail'). */
export function videoThumbnailForm(id: number, thumbnail: File): FormData {
	const form = new FormData();
	form.append('id', String(id));
	form.append('thumbnail', thumbnail);
	return form;
}

/** POST /subtitle multipart body — field name per FileInterceptor('file'). */
export function subtitleUploadForm(videoId: number, langRFC5646: string, file: File): FormData {
	const form = new FormData();
	form.append('videoId', String(videoId));
	form.append('langRFC5646', langRFC5646);
	form.append('file', file);
	return form;
}

/** PATCH /channel multipart body — field name per FileInterceptor('avatar'). */
export function channelUpdateForm(
	id: number,
	values: { name: string; description: string },
	avatar?: File,
): FormData {
	const form = new FormData();
	form.append('id', String(id));
	form.append('name', values.name);
	form.append('description', values.description);
	if (avatar) form.append('avatar', avatar);
	return form;
}
