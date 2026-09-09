import { useState } from 'react';
import { toast } from 'sonner';

// Nocturne components/ops.html: .secret[data-masked] with a reveal toggle and
// copy. The mask is a fixed bullet run — the value's real length never leaks.
const MASK = '••••••••••••••••••••';

/** A secret the owner occasionally needs to read and copy — a stream key. */
export function SecretField({
	id,
	label,
	value,
	hint,
}: {
	id: string;
	label: string;
	value: string;
	hint: string;
}) {
	const [revealed, setRevealed] = useState(false);

	const copy = () => {
		// the copy always carries the real value, masked or not
		navigator.clipboard?.writeText(value).catch(() => {});
		toast.success(`${label} copied`);
	};

	return (
		<div className="field">
			<label htmlFor={id}>{label}</label>
			<div className="secret" data-masked={!revealed}>
				<code id={id}>{revealed ? value : MASK}</code>
				<button
					className="btn btn-ghost btn-sm"
					type="button"
					aria-pressed={revealed}
					onClick={() => setRevealed((previous) => !previous)}
				>
					{revealed ? 'Hide' : 'Reveal'}
				</button>
				<button className="btn btn-ghost btn-sm" type="button" onClick={copy}>
					Copy
				</button>
			</div>
			<p className="field-hint">{hint}</p>
		</div>
	);
}
