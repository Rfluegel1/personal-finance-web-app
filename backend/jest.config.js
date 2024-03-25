const isStaging = process.env.NODE_ENV === 'staging';

module.exports = {
    displayName: 'backend',
    testEnvironment: 'node',
    testMatch: ['<rootDir>/tests/**/*.spec.ts'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    globalSetup: isStaging ? undefined : '<rootDir>/tests/globalSetup.ts',
    globalTeardown: isStaging ? undefined : '<rootDir>/tests/globalTeardown.ts',
    transform: {
        '^.+\\.jsx?$': 'babel-jest', '^.+\\.tsx?$': 'ts-jest'
    },
    setupFilesAfterEnv: isStaging ? ['./tests/jest.stagingSetup'] : undefined
};
