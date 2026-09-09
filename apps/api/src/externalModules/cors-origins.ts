/**
 * parses CORS_ORIGINS (comma-separated) into the allowed-origins list —
 * unset/empty yields no origins, i.e. CORS closed (same-origin only), the
 * default since dev and prod are both same-origin behind proxies
 */
export const parseCorsOrigins = (raw: string | undefined): string[] =>
	(raw ?? '')
		.split(',')
		.map((origin) => origin.trim())
		.filter(Boolean);
