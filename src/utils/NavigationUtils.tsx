import {
  CommonActions,
  createNavigationContainerRef,
  StackActions,
} from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export async function navigate(routeName: string, params?: object) {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(CommonActions.navigate(routeName, params));
  } else {
  }
}

export async function replace(routeName: string, params?: object) {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(StackActions.replace(routeName, params));
  } else {
  }
}

export async function resetAndNavigate(routeName: string) {
  console.log('Attempting to navigate to:', routeName);

  if (navigationRef.isReady()) {
    console.log('Navigation is ready, dispatching reset to:', routeName);
    navigationRef.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{name: routeName}],
      }),
    );
  } else {
    console.log('Navigation not ready, retrying in 1 second...');
    // Try again after a short delay
    setTimeout(() => {
      if (navigationRef.isReady()) {
        console.log(
          'Navigation ready on retry, dispatching reset to:',
          routeName,
        );
        navigationRef.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{name: routeName}],
          }),
        );
      } else {
        console.error('Navigation still not ready after retry');
      }
    }, 1000);
  }
}

export async function goBack() {
  if (navigationRef.isReady()) {
    // Check if there's a screen to go back to
    if (navigationRef.canGoBack()) {
      navigationRef.dispatch(CommonActions.goBack());
    } else {
      console.warn('No screen to go back to');
      // Optionally navigate to a default screen or do nothing
    }
  } else {
    console.warn('Navigation not ready');
  }
}

export async function push(routeName: string, params?: object) {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(StackActions.push(routeName, params));
  } else {
  }
}

export async function prepareNavigation() {
  if (navigationRef.isReady()) {
  } else {
  }
}
