'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.Default = Default;
const class_transformer_1 = require('class-transformer');
function Default(defaultValue, options) {
	return (0, class_transformer_1.Transform)(({ value, key, obj, type }) => {
		if (value !== null && value !== undefined && value.toString() !== '') return value;
		if (typeof defaultValue === 'function') return defaultValue();
		if (Array.isArray(defaultValue)) return [...defaultValue];
		if (typeof defaultValue === 'object') {
			return defaultValue === null ? null : { ...defaultValue };
		}
		return defaultValue;
	}, options);
}
//# sourceMappingURL=default-value.decorator.js.map
