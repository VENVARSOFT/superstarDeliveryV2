module.exports = {
  project: {
    ios: {
      sourceDir: './ios',
    },
    android: {},
  },
  'react-native-vector-icons': {
    platforms: {
      ios: null,
    },
  },
  assets: ['./src/assets/fonts/'],
  getTransformModulePath() {
    return require.resolve('react-native-typescript-transformer');
  },
  getSourceExts() {
    return ['ts', 'tsx'];
  },
};
