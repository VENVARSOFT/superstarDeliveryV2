import axios from 'axios';
import {BASE_URL} from './config';
import {tokenManager} from '@utils/tokenManager';

// Import Reactotron for API monitoring
let reactotron: any = null;
if (__DEV__) {
  try {
    // Use the global Reactotron instance that's already configured
    reactotron = (global as any).Reactotron;
  } catch (error) {
    console.log('Reactotron not available:', error);
  }
}

export const appAxios = axios.create({
  baseURL: BASE_URL,
});

appAxios.interceptors.request.use(async config => {
  // Get valid access token (refresh if needed)
  const accessToken = await tokenManager.getValidAccessToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  // Log API request to Reactotron
  if (reactotron && __DEV__ && typeof reactotron.api === 'function') {
    try {
      reactotron.api({
        name: `${config.method?.toUpperCase()} ${config.url}`,
        request: {
          url: config.url,
          method: config.method,
          data: config.data,
          headers: config.headers,
        },
      });
    } catch (error) {
      console.log('Reactotron API logging failed:', error);
    }
  }

  return config;
});

appAxios.interceptors.response.use(
  response => {
    // Log successful API response to Reactotron
    if (reactotron && __DEV__ && typeof reactotron.api === 'function') {
      try {
        reactotron.api({
          name: `${response.config.method?.toUpperCase()} ${
            response.config.url
          }`,
          response: {
            status: response.status,
            statusText: response.statusText,
            data: response.data,
            headers: response.headers,
          },
        });
      } catch (loggingError) {
        console.log('Reactotron API logging failed:', loggingError);
      }
    }
    return response;
  },
  async error => {
    // Log API error to Reactotron
    if (reactotron && __DEV__ && typeof reactotron.api === 'function') {
      try {
        reactotron.api({
          name: `${error.config?.method?.toUpperCase()} ${error.config?.url}`,
          response: {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            headers: error.response?.headers,
          },
          error: true,
        });
      } catch (loggingError) {
        console.log('Reactotron API logging failed:', loggingError);
      }
    }

    if (error.response && error.response.status === 401) {
      try {
        // Try to refresh token
        const newAccessToken = await tokenManager.getValidAccessToken();
        if (newAccessToken) {
          error.config.headers.Authorization = `Bearer ${newAccessToken}`;
          return axios(error.config);
        } else {
          // If refresh fails, clear tokens and redirect to login
          tokenManager.clearTokens();
          // You might want to dispatch a logout action here
        }
      } catch (refreshError) {
        tokenManager.clearTokens();
      }
    }

    if (error.response && error.response.status !== 401) {
      const errorMessage =
        error.response.data.message || 'something went wrong';
      console.log('API Error:', errorMessage);
    }

    return Promise.resolve(error);
  },
);
