import { mergeArrOfObjIntoObj } from './merge-arr-of-obj-into-obj';

export function mapColsToReturningKeys(keys: object) {
	const usersCols = mergeArrOfObjIntoObj(
		Object.keys(keys).map((key) => {
			return { [key]: true };
		}),
	);

	return usersCols;
}
