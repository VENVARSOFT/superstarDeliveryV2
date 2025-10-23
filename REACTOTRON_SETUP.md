# Reactotron Setup for API Monitoring

This guide will help you set up Reactotron to monitor API calls in your React Native app.

## What's Been Set Up

1. **Reactotron Dependencies**: Added `reactotron-react-native` and `reactotron-redux` to the project
2. **Configuration**: Created `src/utils/ReactotronConfig.ts` with proper setup
3. **API Monitoring**: Updated `src/service/apiInterceptors.tsx` to log all API calls
4. **App Integration**: Added Reactotron import to `App.tsx` (development only)

## How to Use

### 1. Start Reactotron

You can start Reactotron in two ways:

**Option A: Using npm script**

```bash
npm run reactotron
```

**Option B: Direct command**

```bash
reactotron
```

### 2. Run Your React Native App

In a separate terminal, start your React Native app:

```bash
# For Android
npm run android

# For iOS
npm run ios
```

### 3. View API Calls

Once both Reactotron and your app are running:

1. Open the Reactotron desktop app
2. You should see your app connected (named "Blinkit App")
3. Navigate to the "API" tab to see all API calls
4. Each API call will show:
   - Request details (URL, method, headers, data)
   - Response details (status, data, headers)
   - Error information (if any)

## What You'll See

- **Request Logs**: All outgoing API requests with full details
- **Response Logs**: All incoming API responses with status and data
- **Error Logs**: Failed requests with error details
- **Network Tab**: Real-time network activity

## Features

- ✅ Automatic API call logging
- ✅ Request/response details
- ✅ Error tracking
- ✅ Development-only (won't affect production builds)
- ✅ Network monitoring
- ✅ Redux state tracking (if you use Redux)

## Troubleshooting

### Reactotron Not Connecting

1. Make sure Reactotron desktop app is running
2. Check that your app is in development mode (`__DEV__` is true)
3. Restart both Reactotron and your React Native app

### No API Calls Showing

1. Verify the app is making API calls
2. Check that `src/service/apiInterceptors.tsx` is being used
3. Ensure you're using the `appAxios` instance for API calls

### Permission Issues

If you get permission errors when installing Reactotron globally:

```bash
sudo npm install -g reactotron
```

## Additional Notes

- Reactotron only runs in development mode
- API calls are logged automatically through axios interceptors
- You can also manually log custom events using `reactotron.log()` or `reactotron.display()`
- The setup includes Redux integration if you decide to use Redux later
