export function mergeArrOfObjIntoObj(arrayOfObjects: object[]) {
	const mergedObject = arrayOfObjects.reduce((acc, obj) => {
		for (const key in obj) {
			acc[key] = obj[key];
		}
		return acc;
	}, {});

	return mergedObject;
}
