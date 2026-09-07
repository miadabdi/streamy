export default {
	'apps/**/*.{ts,js}': ['prettier --write --ignore-unknown'],
	'packages/**/*.{ts,js,json}': ['prettier --write --ignore-unknown'],
	'*.{json,md,yml}': ['prettier --write --ignore-unknown'],
};
