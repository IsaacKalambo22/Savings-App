// ESLint v9 flat config (migrated from the deprecated .eslintrc format).
const expoConfig = require("eslint-config-expo/flat");

module.exports = [
  ...expoConfig,
  {
    ignores: [
      "node_modules/**",
      ".expo/**",
      "dist/**",
      "prisma/**",
      "*.config.js",
    ],
  },
];
