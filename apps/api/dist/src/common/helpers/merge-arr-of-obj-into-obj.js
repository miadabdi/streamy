'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.mergeArrOfObjIntoObj = mergeArrOfObjIntoObj;
function mergeArrOfObjIntoObj(arrayOfObjects) {
	const mergedObject = arrayOfObjects.reduce((acc, obj) => {
		for (const key in obj) {
			acc[key] = obj[key];
		}
		return acc;
	}, {});
	return mergedObject;
}
//# sourceMappingURL=merge-arr-of-obj-into-obj.js.map
