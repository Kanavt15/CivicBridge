const { getDefaultConfig } = require("expo/metro-config");
const path = require("node:path");
const config = getDefaultConfig(__dirname);
config.watchFolders = [path.resolve(__dirname, "..")];
config.resolver.nodeModulesPaths = [path.resolve(__dirname, "node_modules")];
const escaped = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/[/\\]/g, "[/\\\\]");
const existing = config.resolver.blockList;
config.resolver.blockList = [
  ...(Array.isArray(existing) ? existing : existing ? [existing] : []),
  new RegExp(
    `${escaped(path.resolve(__dirname, ".."))}[/\\\\](?:\\.data|\\.next|artifacts)[/\\\\]`,
  ),
  new RegExp(`${escaped(__dirname)}[/\\\\](?:android|ios)[/\\\\]`),
];
module.exports = config;
