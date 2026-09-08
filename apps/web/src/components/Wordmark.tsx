import type { HTMLAttributes } from 'react';

// The accent dot comes from the .wordmark class in nocturne.css — do not re-implement it here.
export function Wordmark({ className = '', ...props }: HTMLAttributes<HTMLSpanElement>) {
	return (
		<span className={`wordmark ${className}`.trim()} {...props}>
			STREAMY
		</span>
	);
}
