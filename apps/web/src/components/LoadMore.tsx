export function LoadMore({
	onLoad,
	showing,
	busy,
}: {
	onLoad: () => void;
	showing: number;
	busy?: boolean;
}) {
	return (
		<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
			<button className="btn btn-secondary" type="button" onClick={onLoad} disabled={busy}>
				Load more
			</button>
			<p
				className="mono"
				style={{ margin: 0, fontSize: 11, color: 'var(--color-muted)' }}
			>
				showing {showing} · the API returns a plain list, so there is no total
			</p>
		</div>
	);
}
