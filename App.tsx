import React from 'react';
import Navigation from '@navigation/Navigation';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {store, persistor} from '@state/store';

// Import Reactotron configuration (only in development)
if (__DEV__) {
  require('./src/utils/ReactotronConfig');
}

const App = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <Navigation />
      </PersistGate>
    </Provider>
  );
};

export default App;
