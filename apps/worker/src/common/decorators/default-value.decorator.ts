import { Transform, TransformFnParams, TransformOptions } from 'class-transformer';

export function Default(defaultValue: any, options?: TransformOptions) {
	return Transform(({ value, key, obj, type }: TransformFnParams) => {
		if (value !== null && value !== undefined && value.toString() !== '') return value;
		if (typeof defaultValue === 'function') return defaultValue();
		if (Array.isArray(defaultValue)) return [...defaultValue];
		if (typeof defaultValue === 'object') {
			return defaultValue === null ? null : { ...defaultValue };
		}
		return defaultValue;
	}, options);
}
