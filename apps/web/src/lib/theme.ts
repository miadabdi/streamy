import { useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';
export type Density = 'compact' | 'roomy';

const THEME_KEY = 'streamy.theme';
const DENSITY_KEY = 'streamy.density';

function readStored(key: string): string | null {
	try {
		return localStorage.getItem(key);
	} catch {
		return null; // storage unavailable — defaults apply
	}
}

/**
 * Theme and density for the app. Dark + compact are the designed defaults
 * (studio); `data-theme`/`data-density` land on `<html>`, values persist to
 * localStorage, and the inline script in index.html applies them pre-paint
 * so there is no flash of the wrong theme.
 */
export function useTheme() {
	const [theme, setTheme] = useState<Theme>(() =>
		readStored(THEME_KEY) === 'light' ? 'light' : 'dark',
	);
	const [density, setDensity] = useState<Density>(() =>
		readStored(DENSITY_KEY) === 'roomy' ? 'roomy' : 'compact',
	);

	useEffect(() => {
		localStorage.setItem(THEME_KEY, theme);
		document.documentElement.dataset.theme = theme;
	}, [theme]);

	useEffect(() => {
		localStorage.setItem(DENSITY_KEY, density);
		document.documentElement.dataset.density = density;
	}, [density]);

	return { theme, density, setTheme, setDensity };
}
