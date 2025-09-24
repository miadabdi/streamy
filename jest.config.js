module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	moduleFileExtensions: ['js', 'json', 'ts'],
	rootDir: 'src',
	testRegex: '.*\\.spec\\.ts$',
	transform: {
		'^.+\\.(t|j)s$': 'ts-jest',
	},
	collectCoverageFrom: ['**/*.(t|j)s'],
	coverageDirectory: '../coverage',
	// Exclude the nested streamy directory to avoid haste collision
	modulePathIgnorePatterns: ['<rootDir>/../streamy/'],
	testPathIgnorePatterns: ['<rootDir>/../streamy/'],
};
