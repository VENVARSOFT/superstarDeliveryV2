import {configureStore, combineReducers} from '@reduxjs/toolkit';
import {persistReducer, persistStore} from 'redux-persist';
import type {PersistConfig} from 'redux-persist';
import authReducer from './authSlice';
import cartReducer from './cartSlice';
import mapReducer from './mapSlice';
import reduxStorage from './storage.redux';

const rootReducer = combineReducers({
  auth: authReducer,
  cart: cartReducer,
  map: mapReducer,
});

type RootState = ReturnType<typeof rootReducer>;

const persistConfig: PersistConfig<RootState> = {
  key: 'root',
  storage: reduxStorage,
  whitelist: ['auth', 'cart'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  enhancers: getDefaultEnhancers => {
    const baseEnhancers = getDefaultEnhancers();
    // @ts-ignore - createEnhancer may not exist depending on plugin version
    const reactotronEnhancer = (global as any)?.Reactotron?.createEnhancer?.();
    if (__DEV__ && reactotronEnhancer) {
      return [...baseEnhancers, reactotronEnhancer];
    }
    return baseEnhancers;
  },
});

export const persistor = persistStore(store);

export type AppDispatch = typeof store.dispatch;
export type {RootState};
