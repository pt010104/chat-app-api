const path = require('path');


module.exports = {
  resolver: {
    // Add polyfills for Node.js core modules
    extraNodeModules: {
      crypto: require.resolve('react-native-crypto'),
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer'),
    },
  },
  transformer: {
    // Custom transformer can be added here if needed
  },
  // Optional: include extra file extensions or assets if required
  watchFolders: [
    path.resolve(__dirname, 'node_modules'),
  ],
};
