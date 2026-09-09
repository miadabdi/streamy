import { useState, type ChangeEvent, type DragEvent } from 'react';
import { UploadIcon } from '../icons';

/**
 * Click-or-drag file target. The input is an invisible overlay covering the
 * whole zone, so the entire area is one native click target (no JS click
 * forwarding) and screen readers still see a labelled file input.
 */
export function Dropzone({
	onFile,
	hint,
}: {
	onFile: (file: File) => void;
	hint?: string;
}) {
	const [over, setOver] = useState(false);

	const onDrop = (event: DragEvent) => {
		event.preventDefault();
		setOver(false);
		const file = event.dataTransfer.files?.[0];
		if (file) onFile(file);
	};

	const onChange = (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.currentTarget.files?.[0];
		if (file) onFile(file);
	};

	return (
		<div
			className="dropzone"
			data-over={over}
			style={{ position: 'relative', cursor: 'pointer' }}
			onDragOver={(event) => {
				event.preventDefault();
				setOver(true);
			}}
			onDragLeave={() => setOver(false)}
			onDrop={onDrop}
		>
			<UploadIcon width={26} height={26} aria-hidden />
			<div style={{ fontSize: 13, color: 'var(--color-text)' }}>
				Drop your video here, or{' '}
				<span style={{ textDecoration: 'underline' }}>choose a file</span>
			</div>
			{hint && <div className="stat-note">{hint}</div>}
			<input
				aria-label="Choose a video file"
				type="file"
				accept="video/*"
				onChange={onChange}
				style={{
					position: 'absolute',
					inset: 0,
					width: '100%',
					height: '100%',
					opacity: 0,
					cursor: 'pointer',
				}}
			/>
		</div>
	);
}
