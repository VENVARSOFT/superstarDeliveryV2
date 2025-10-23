// Wrap existing MMKV instance to match redux-persist Storage interface
import type {Storage} from 'redux-persist';
import {storage as mmkv} from './storage';

const reduxStorage: Storage = {
  setItem: (key: string, value: string): Promise<boolean> => {
    try {
      mmkv.set(key, value);
      return Promise.resolve(true);
    } catch (e) {
      return Promise.reject(e);
    }
  },
  getItem: (key: string): Promise<string | null> => {
    try {
      const value = mmkv.getString(key);
      return Promise.resolve(value ?? null);
    } catch (e) {
      return Promise.reject(e);
    }
  },
  removeItem: (key: string): Promise<void> => {
    try {
      mmkv.delete(key);
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  },
};

export default reduxStorage;
