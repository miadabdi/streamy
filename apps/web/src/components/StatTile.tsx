import type { ReactNode } from 'react';
import { FailedIcon, OkIcon } from './icons';

/**
 * One readiness datum as a Nocturne .stat tile (Nocturne/components/ops.html).
 * status ok/bad tints the whole tile and picks the label check/cross icon;
 * flag renders the encoder pill — sw is visibly a degraded fallback.
 */
export function StatTile({
	label,
	value,
	note,
	status,
	flag,
	small,
	mono,
	icon,
}: {
	label: string;
	value: ReactNode;
	note?: ReactNode;
	status?: 'ok' | 'bad';
	flag?: 'hw' | 'sw';
	/** long values (encoder name, job id) use the template's smaller size */
	small?: boolean;
	mono?: boolean;
	icon?: ReactNode;
}) {
	const statusIcon =
		status === 'ok' ? (
			<OkIcon width={14} height={14} aria-hidden />
		) : status === 'bad' ? (
			<FailedIcon width={14} height={14} aria-hidden />
		) : null;

	return (
		<div className={`stat${status ? ` stat-${status}` : ''}`}>
			<div className="stat-label">
				<span>{label}</span>
				{icon ?? statusIcon}
			</div>
			<div
				className={`stat-value${mono ? ' mono' : ''}`}
				style={small ? { fontSize: 17 } : undefined}
			>
				{value}
			</div>
			{flag && (
				<div style={{ display: 'flex', gap: 6 }}>
					<span className={`stat-flag stat-flag-${flag}`}>
						{flag === 'hw' ? 'Hardware' : 'Software fallback'}
					</span>
				</div>
			)}
			{note != null && <div className="stat-note">{note}</div>}
		</div>
	);
}
