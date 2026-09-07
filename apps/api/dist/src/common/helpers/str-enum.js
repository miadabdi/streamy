'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.strEnum = strEnum;
function strEnum(o) {
	return o.reduce((res, key) => {
		res[key] = key;
		return res;
	}, Object.create({}));
}
//# sourceMappingURL=str-enum.js.map
