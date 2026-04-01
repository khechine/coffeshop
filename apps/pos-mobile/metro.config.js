const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch the workspace root
config.watchFolders = [...config.watchFolders, workspaceRoot];

// 2. Add extra resolution for pnpm symlinks
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Explicit mapping for problematic modules (pinning to local)
config.resolver.extraNodeModules = {
  // Pin core dependencies to the app's local installation
  'react': path.resolve(projectRoot, 'node_modules/react'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
  '@babel/runtime': path.resolve(projectRoot, 'node_modules/@babel/runtime'),
  
  // App-specific resolution
  'expo-notifications': path.resolve(projectRoot, 'node_modules/expo-notifications'),
  'expo-device': path.resolve(projectRoot, 'node_modules/expo-device'),
  'styleq': path.resolve(projectRoot, 'node_modules/styleq'),
  'react-refresh': path.resolve(projectRoot, 'node_modules/react-refresh'),
};


module.exports = config;
