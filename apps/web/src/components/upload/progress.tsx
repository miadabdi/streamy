import { formatBytes } from '../../lib/format';

/** The upload card: file name, mono `NN% · sent of total` meter and the bar. */
export function UploadProgress({
	file,
	loaded,
	total,
}: {
	file: string;
	loaded: number;
	total: number;
}) {
	const percent = total > 0 ? Math.floor((loaded / total) * 100) : 0;
	return (
		<div className="card" style={{ gap: 'var(--space-3)' }}>
			<div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
				<span
					style={{
						fontSize: 13,
						fontWeight: 500,
						flex: 1,
						minWidth: 0,
						overflow: 'hidden',
						textOverflow: 'ellipsis',
						whiteSpace: 'nowrap',
					}}
				>
					{file}
				</span>
				<span className="mono" style={{ fontSize: 11, color: 'var(--color-muted)' }}>
					{percent}% · {formatBytes(loaded)} of {formatBytes(total)}
				</span>
			</div>
			<div className="progress">
				<i style={{ width: `${percent}%` }} />
			</div>
		</div>
	);
}
