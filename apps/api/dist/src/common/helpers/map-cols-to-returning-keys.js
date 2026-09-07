'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.mapColsToReturningKeys = mapColsToReturningKeys;
const merge_arr_of_obj_into_obj_1 = require('./merge-arr-of-obj-into-obj');
function mapColsToReturningKeys(keys) {
	const usersCols = (0, merge_arr_of_obj_into_obj_1.mergeArrOfObjIntoObj)(
		Object.keys(keys).map((key) => {
			return { [key]: true };
		}),
	);
	return usersCols;
}
//# sourceMappingURL=map-cols-to-returning-keys.js.map
