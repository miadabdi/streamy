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
