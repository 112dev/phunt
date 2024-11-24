/**
 * @type {import("jest").Config}
 */
export default {
  verbose: true,
  testEnvironment: "node",
  passWithNoTests: true,
  transform: {
    "\\.[jt]s?$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  moduleNameMapper: {
    "(.+)\\.js": "$1",
  },
  extensionsToTreatAsEsm: [".ts"],
};
