/** @type {import("jest").Config} */
module.exports = {
  testEnvironment: "node",
  maxWorkers: 1,
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.test.json",
      },
    ],
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  testMatch: ["**/tests/unit/**/*.test.ts"],
};
