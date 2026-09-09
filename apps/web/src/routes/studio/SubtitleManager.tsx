import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { subtitleUploadForm } from '../../lib/forms';
import { RFC5646_LANGUAGES } from '../../lib/languages';
import type { Subtitle, WatchVideo } from '../../types/api';

export function SubtitleManager({ video }: { video: WatchVideo }) {
	const queryClient = useQueryClient();
	const [lang, setLang] = useState('en');

	const invalidate = () => {
		void queryClient.invalidateQueries({ queryKey: ['video', video.id] });
	};

	const upload = useMutation({
		mutationFn: (input: { lang: string; file: File }) =>
			api.post<Subtitle>('/api/v1/subtitle', subtitleUploadForm(video.id, input.lang, input.file)),
		onSuccess: () => {
			toast.success('Subtitle uploaded');
			invalidate();
		},
		onError: (error) => toast.error(error.message),
	});
	const remove = useMutation({
		mutationFn: (id: number) => api.del<{ message: string }>(`/api/v1/subtitle?id=${id}`),
		onSuccess: () => {
			toast.success('Subtitle deleted');
			invalidate();
		},
		onError: (error) => toast.error(error.message),
	});

	return (
		<section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
			<div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
				<h6 style={{ margin: 0 }}>Subtitles</h6>
			</div>
			{video.subtitles.length === 0 ? (
				<p className="page-sub">No subtitles yet — add the first one below.</p>
			) : (
				<div
					style={{
						borderRadius: 'var(--radius-md)',
						background: 'var(--color-surface)',
						boxShadow: 'var(--shadow-sm)',
						overflow: 'hidden',
					}}
				>
					<table className="table">
						<thead>
							<tr>
								<th>Language</th>
								<th>Tag</th>
								<th style={{ textAlign: 'right' }}>Actions</th>
							</tr>
						</thead>
						<tbody>
							{video.subtitles.map((subtitle) => (
								<tr key={subtitle.id}>
									<td>{RFC5646_LANGUAGES[subtitle.langRFC5646] ?? subtitle.langRFC5646}</td>
									<td className="mono" style={{ fontSize: 11 }}>
										{subtitle.langRFC5646}
									</td>
									<td style={{ textAlign: 'right' }}>
										<button
											className="btn btn-ghost btn-sm"
											type="button"
											disabled={remove.isPending && remove.variables === subtitle.id}
											onClick={() => remove.mutate(subtitle.id)}
										>
											Delete
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
			<div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
				<select
					aria-label="Subtitle language"
					className="input"
					style={{ maxWidth: 260 }}
					value={lang}
					onChange={(e) => setLang(e.target.value)}
				>
					{Object.entries(RFC5646_LANGUAGES).map(([code, label]) => (
						<option key={code} value={code}>
							{label} ({code})
						</option>
					))}
				</select>
				<input
					type="file"
					aria-label="Subtitle file"
					className="input"
					style={{ maxWidth: 260 }}
					accept=".vtt,text/vtt"
					disabled={upload.isPending}
					onChange={(e) => {
						const file = e.target.files?.[0];
						if (file) upload.mutate({ lang, file });
						// clearing lets the same file be picked again for another language
						e.target.value = '';
					}}
				/>
			</div>
			<p className="field-hint mono">
				Language tags follow RFC 5646 — en, en-GB, fa-IR. One file per language.
			</p>
		</section>
	);
}
