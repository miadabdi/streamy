import type { ReactNode } from 'react';

/** The template's repeated `.field` markup: label + control + one hint-or-error line. */
export function Field({
	htmlFor,
	label,
	error,
	hint,
	children,
}: {
	htmlFor: string;
	label: string;
	error?: string;
	hint?: ReactNode;
	children: ReactNode;
}) {
	return (
		<div className="field">
			<label htmlFor={htmlFor}>{label}</label>
			{children}
			{error ? <p className="field-error">{error}</p> : hint}
		</div>
	);
}
