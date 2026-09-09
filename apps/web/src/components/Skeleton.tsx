/** Loading placeholders shaped like what loads in — surface-tinted Nocturne
 *  (`.skel` in nocturne.css), not shadcn defaults. Used only on the three
 *  heaviest loads (browse grid, watch page, studio table); light fetches keep
 *  their plain text state. Shimmer stops under prefers-reduced-motion. */

function Bar({ w, h, radius, aspect }: { w?: number | string; h?: number; radius?: string; aspect?: string }) {
	return (
		<div
			className="skel"
			aria-hidden
			style={{ width: w, height: h, borderRadius: radius, aspectRatio: aspect }}
		/>
	);
}

/** One grid-shaped placeholder — mirrors .vcard geometry (16:9 thumb, title, meta). */
function GridItem() {
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
			<Bar aspect="16 / 9" radius="var(--radius-md)" />
			<Bar w="85%" h={12} />
			<Bar w="55%" h={10} />
		</div>
	);
}

/** One row-shaped placeholder — mirrors the studio table row (thumb + name). */
function RowItem() {
	return (
		<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
			<Bar w={76} h={44} radius="var(--radius-md)" />
			<Bar w="40%" h={12} />
		</div>
	);
}

/** The watch page while /video/by-id is in flight: player, title, channel row. */
function WatchShape() {
	return (
		<>
			<Bar aspect="16 / 9" radius="var(--radius-md)" />
			<div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 2 }}>
				<Bar w="70%" h={18} />
				<div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
					<Bar w={32} h={32} radius="50%" />
					<Bar w="28%" h={11} />
				</div>
			</div>
		</>
	);
}

export type SkeletonVariant = 'text' | 'grid' | 'card-row' | 'watch';

export function Skeleton({
	variant = 'text',
	count = 1,
}: {
	variant?: SkeletonVariant;
	count?: number;
}) {
	const items = Array.from({ length: count }, (_, i) => i);
	return (
		<div role="status" aria-label="Loading">
			{variant === 'grid' ? (
				// the same .vgrid the real cards render into, so nothing shifts on arrival
				<div className="vgrid">
					{items.map((i) => (
						<GridItem key={i} />
					))}
				</div>
			) : variant === 'watch' ? (
				<div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
					<WatchShape />
				</div>
			) : variant === 'card-row' ? (
				<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
					{items.map((i) => (
						<RowItem key={i} />
					))}
				</div>
			) : (
				<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
					{items.map((i) => (
						<Bar key={i} w={i === count - 1 && count > 1 ? '60%' : '100%'} h={12} />
					))}
				</div>
			)}
		</div>
	);
}
