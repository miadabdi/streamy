export declare function strEnum<T extends string>(
	o: T[],
): {
	[K in T]: K;
};
