const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Add resolver for react-native-css-interop
config.resolver.sourceExts = [...config.resolver.sourceExts, "css"];

// Add pnpm hoisted packages resolution
const projectRoot = __dirname;
const extraNodeModules = {
  "react-native-css-interop": path.resolve(projectRoot, "node_modules/react-native-css-interop"),
};

config.resolver.extraNodeModules = extraNodeModules;

module.exports = withNativeWind(config, { input: "./global.css" });
