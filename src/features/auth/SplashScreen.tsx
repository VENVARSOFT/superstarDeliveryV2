import {StyleSheet, Alert, Image} from 'react-native';
import React, {FC, useEffect} from 'react';
import LinearGradient from 'react-native-linear-gradient';
import {screenHeight, screenWidth} from '@utils/Scaling';
import {resetAndNavigate} from '@utils/NavigationUtils';
import GeoLocation from '@react-native-community/geolocation';
import {useAuthStore} from '@state/authStore';
import {tokenManager} from '@utils/tokenManager';
import {refetchUser} from '@service/authService';
import {Images} from '@utils/ImageUtils';
import CustomText from '@components/ui/CustomText';
import {Fonts} from '@utils/Constants';

GeoLocation.setRNConfiguration({
  skipPermissionRequests: false,
  authorizationLevel: 'whenInUse',
  enableBackgroundLocationUpdates: true,
  locationProvider: 'auto',
});

const SplashScreen: FC = () => {
  const {user, setUser} = useAuthStore();
  console.log('user', user);

  const tokenCheck = async () => {
    try {
      // Check if user is authenticated using tokenManager
      if (tokenManager.isAuthenticated()) {
        // Get valid access token (will refresh if needed)
        const validToken = await tokenManager.getValidAccessToken();

        if (validToken) {
          // If user data exists in Redux, navigate to appropriate dashboard based on user type
          if (user) {
            Alert.alert('user', user);
            const userType = user as any;
            Alert.alert('userType', userType);
            if (userType) {
              resetAndNavigate('Home');
            } else {
              resetAndNavigate('CustomerLogin');
            }
            return true;
          } else {
            // If no user data, try to fetch it
            try {
              await refetchUser(setUser);
              // Wait a bit for Redux state to update
              await new Promise(resolve => setTimeout(resolve, 100));
              // Check user again after refetch
              if (user) {
                const userType = user as any;
                if (userType) {
                  resetAndNavigate('Home');
                } else {
                  resetAndNavigate('CustomerLogin');
                }
                return true;
              } else {
                // Still no user data, redirect to login
                tokenManager.clearTokens();
                resetAndNavigate('CustomerLogin');
                return false;
              }
            } catch (error) {
              console.error('Failed to fetch user data:', error);
              // Clear invalid tokens and redirect to login
              tokenManager.clearTokens();
              resetAndNavigate('CustomerLogin');
              return false;
            }
          }
        } else {
          // Token refresh failed, clear tokens and redirect to login
          tokenManager.clearTokens();
          resetAndNavigate('CustomerLogin');
          return false;
        }
      } else {
        // No valid tokens, redirect to login
        resetAndNavigate('CustomerLogin');
        return false;
      }
    } catch (error) {
      console.error('Token check error:', error);
      tokenManager.clearTokens();
      resetAndNavigate('CustomerLogin');
      return false;
    }
  };

  useEffect(() => {
    const initialStartup = async () => {
      try {
        // Request location permission
        await GeoLocation.requestAuthorization();

        // Add a small delay to ensure navigation is ready
        setTimeout(async () => {
          await tokenCheck();
        }, 500);
      } catch (error) {
        console.warn('Location permission error:', error);
        Alert.alert(
          'Location Permission',
          'Sorry we need location service to give you better shopping experience',
        );
        // Still try to navigate even if location fails
        setTimeout(async () => {
          await tokenCheck();
        }, 500);
      }
    };

    const timeoutId = setTimeout(initialStartup, 1000);
    return () => clearTimeout(timeoutId);
    // We intentionally run on mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <LinearGradient
      colors={[
        '#f8fff8', // very light green/white
        '#a5d6a7', // final green shade
        '#c8e6c9', // medium light green
        '#d4edd4', // slightly darker
        '#f0fdf0', // lightest green
        '#e8f5e9', // light green
      ]}
      start={{x: 0, y: 0}}
      end={{x: 0, y: 1}}
      style={styles.container}>
      <Image source={Images.LogoMain} style={styles.logoImage} />
      <CustomText variant="h4" fontFamily={Fonts.SemiBold}>
        Delivery Partner
      </CustomText>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    height: screenHeight * 0.4,
    width: screenWidth * 0.4,
    resizeMode: 'contain',
  },
});

export default SplashScreen;
