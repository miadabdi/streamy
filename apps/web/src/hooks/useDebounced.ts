import { useEffect, useState } from 'react';

/** Mirrors `value` after it has stopped changing for `delay` ms. */
export function useDebounced<T>(value: T, delay = 300): T {
	const [debounced, setDebounced] = useState(value);

	useEffect(() => {
		const timer = setTimeout(() => setDebounced(value), delay);
		return () => clearTimeout(timer);
	}, [value, delay]);

	return debounced;
}
