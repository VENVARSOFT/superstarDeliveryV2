import Reactotron from 'reactotron-react-native';
import {reactotronRedux} from 'reactotron-redux';

// expose to global for store enhancer usage
// @ts-ignore
(global as any).Reactotron = Reactotron;

Reactotron.configure({}).useReactNative().use(reactotronRedux()).connect();

// Override console methods to ensure all logs are captured
if (__DEV__) {
  const originalConsoleLog = console.log;
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;
  const originalConsoleInfo = console.info;

  console.log = (...args: any[]) => {
    Reactotron.display({
      name: 'LOG',
      value: args,
      preview: args.length > 0 ? String(args[0]) : 'Log',
    });
    originalConsoleLog(...args);
  };

  // console.warn = (...args: any[]) => {
  //   Reactotron.display({
  //     name: 'WARN',
  //     value: args,
  //     preview: args.length > 0 ? String(args[0]) : 'Warning',
  //   });
  //   originalConsoleWarn(...args);
  // };

  // console.error = (...args: any[]) => {
  //   Reactotron.display({
  //     name: 'ERROR',
  //     value: args,
  //     preview: args.length > 0 ? String(args[0]) : 'Error',
  //   });
  //   originalConsoleError(...args);
  // };

  // console.info = (...args: any[]) => {
  //   Reactotron.display({
  //     name: 'INFO',
  //     value: args,
  //     preview: args.length > 0 ? String(args[0]) : 'Info',
  //   });
  //   originalConsoleInfo(...args);
  // };
}
