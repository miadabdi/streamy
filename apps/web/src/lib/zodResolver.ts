import type { FieldErrors, FieldValues, Resolver } from 'react-hook-form';
import type { ZodType } from 'zod';

// ~25 lines instead of an @hookform/resolvers dependency; nested paths included.
// Only the first issue per field wins (rhf shows one message per field).
export function zodResolver<TValues extends FieldValues>(schema: ZodType): Resolver<TValues> {
	return async (values) => {
		const result = await schema.safeParseAsync(values);
		if (result.success) {
			return { values: result.data as TValues, errors: {} };
		}

		const errors: Record<string, unknown> = {};
		for (const issue of result.error.issues) {
			const path = issue.path.map(String);
			if (path.length === 0) continue;

			let node: Record<string, unknown> = errors;
			for (const key of path.slice(0, -1)) {
				if (typeof node[key] !== 'object' || node[key] === null) node[key] = {};
				node = node[key] as Record<string, unknown>;
			}
			const leaf = path[path.length - 1];
			if (!node[leaf]) {
				node[leaf] = { type: issue.code, message: issue.message };
			}
		}

		return { values: {}, errors: errors as FieldErrors<TValues> };
	};
}
