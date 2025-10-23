/**
 * @format
 */

import 'react-native-get-random-values';
import {AppRegistry, Text, TextInput} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import {configureReanimatedLogger} from 'react-native-reanimated';

// Polyfill for parseErrorStack issue with PhonePe SDK
if (typeof ErrorUtils !== 'undefined' && !ErrorUtils.parseErrorStack) {
  ErrorUtils.parseErrorStack = (error, frames) => {
    return frames || [];
  };
}

try {
  configureReanimatedLogger({
    level: 'warn',
    strict: false,
  });
} catch (_) {}

if (Text.defaultProps) {
  Text.defaultProps.allowFontScaling = false;
} else {
  Text.defaultProps = {};
  Text.defaultProps.allowFontScaling = false;
}

if (TextInput.defaultProps) {
  TextInput.defaultProps.allowFontScaling = false;
} else {
  TextInput.defaultProps = {};
  TextInput.defaultProps.allowFontScaling = false;
}

AppRegistry.registerComponent(appName, () => App);
