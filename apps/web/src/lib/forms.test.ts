import { describe, expect, it } from 'vitest';
import { subtitleUploadForm, videoThumbnailForm } from './forms';

describe('videoThumbnailForm', () => {
	it('builds the PATCH /video/set-thumbnail body the controller expects', () => {
		const file = new File(['x'], 'thumb.png', { type: 'image/png' });
		const form = videoThumbnailForm(1, file);

		// FileInterceptor('thumbnail') in video.controller.ts
		expect(form.get('thumbnail')).toBe(file);
		// SetVideoThumbnailDto.id
		expect(form.get('id')).toBe('1');
	});
});

describe('subtitleUploadForm', () => {
	it('builds the POST /subtitle body the controller expects', () => {
		const file = new File(['WEBVTT'], 'subs.vtt', { type: 'text/vtt' });
		const form = subtitleUploadForm(7, 'fa-IR', file);

		// FileInterceptor('file') in subtitle.controller.ts
		expect(form.get('file')).toBe(file);
		// CreateSubtitleDto fields
		expect(form.get('langRFC5646')).toBe('fa-IR');
		expect(form.get('videoId')).toBe('7');
	});
});
