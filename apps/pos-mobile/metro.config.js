const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch the workspace root
config.watchFolders = [workspaceRoot];

// 2. Add extra resolution for pnpm symlinks
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Explicit mapping for problematic modules
config.resolver.extraNodeModules = {
  'expo-notifications': path.resolve(projectRoot, 'node_modules/expo-notifications'),
  'expo-device': path.resolve(projectRoot, 'node_modules/expo-device'),
  '@babel/runtime': path.resolve(projectRoot, 'node_modules/@babel/runtime'),
  'styleq': path.resolve(projectRoot, 'node_modules/styleq'),
  'react-refresh': path.resolve(projectRoot, 'node_modules/react-refresh'),
};



module.exports = config;


