import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Platform,
  Alert,
  Linking,
  ActivityIndicator,
  Vibration,
} from 'react-native';
import MapView, {
  Circle,
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  Region,
} from 'react-native-maps';
import {
  GestureHandlerRootView,
  PanGestureHandler,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
  Easing,
} from 'react-native-reanimated';
import BottomSheet, {BottomSheetView} from '@gorhom/bottom-sheet';
import Haptic from 'react-native-haptic-feedback';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Geolocation from '@react-native-community/geolocation';
import {Fonts} from '@utils/Constants';
import {
  calculateRoute as calculateRouteService,
  openExternalNavigation,
} from '@service/directionsService';
import {useWS} from '@service/WsProvider';
import {useAuthStore} from '@state/authStore';
import {USER_TYPES} from '@service/config';

// Types
interface PickupLocation {
  latitude: number;
  longitude: number;
  name: string;
  address: string;
  phoneNumber?: string;
}

interface DriverLocation {
  latitude: number;
  longitude: number;
}

interface RoutePoint {
  latitude: number;
  longitude: number;
}

interface PickupNavigationScreenProps {
  route?: {
    params: {
      pickupLocation: PickupLocation;
      driverLocation?: DriverLocation;
      orderId: string;
    };
  };
  navigation?: any;
}

const {width} = Dimensions.get('window');
const PRIMARY_GREEN = '#00A86B';
const SWIPE_THRESHOLD = width * 0.7; // 70% threshold

const PickupNavigationScreen: React.FC<PickupNavigationScreenProps> = ({
  navigation,
  route,
}) => {
  // Socket and Auth
  const socketService = useWS();
  const {user} = useAuthStore();

  // State
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(
    null,
  );
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [_hasLocationPermission, setHasLocationPermission] = useState(false);
  const [eta, setEta] = useState<string>('');
  const [distance, setDistance] = useState<string>('');

  // Refs
  const mapRef = useRef<MapView>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const locationWatchId = useRef<number | null>(null);
  const lastLocationUpdate = useRef<number>(0);
  const lastRouteUpdate = useRef<number>(0);
  const lastSocketLocationUpdate = useRef<number>(0);
  const isInitialized = useRef<boolean>(false);

  // Animated values for swipe-to-confirm
  const swipeTranslateX = useSharedValue(0);
  const isSwipeComplete = useSharedValue(false);

  // Get pickup location from route params
  const pickupLocation = useMemo(() => {
    return (
      route?.params?.pickupLocation || {
        latitude: 17.4475,
        longitude: 78.385,
        name: 'Panchakattu Dosa',
        address: 'Plot 59, Guttala Begumpet, Madhapur, Hyderabad',
        phoneNumber: '+91-9876543210',
      }
    );
  }, [route?.params?.pickupLocation]);

  // Get orderId from route params
  const orderId = useMemo(() => {
    return route?.params?.orderId || null;
  }, [route?.params?.orderId]);

  // Initial driver location
  const initialDriverLocation = useMemo(() => {
    return (
      route?.params?.driverLocation || {
        latitude: 17.442,
        longitude: 78.391,
      }
    );
  }, [route?.params?.driverLocation]);

  // Map region - stable region that doesn't change frequently
  const mapRegion = useMemo((): Region => {
    const location = driverLocation || initialDriverLocation;
    return {
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.015,
      longitudeDelta: 0.0121,
    };
  }, [driverLocation, initialDriverLocation]);

  // Check location permissions
  const checkLocationPermission = useCallback(async () => {
    try {
      const granted = await new Promise<boolean>(resolve => {
        Geolocation.getCurrentPosition(
          () => resolve(true),
          () => resolve(false),
          {enableHighAccuracy: true, timeout: 10000, maximumAge: 1000},
        );
      });
      setHasLocationPermission(granted);
      return granted;
    } catch (error) {
      console.error('Permission check error:', error);
      setHasLocationPermission(false);
      return false;
    }
  }, []);

  // Get current location
  const getCurrentLocation = useCallback((): Promise<DriverLocation> => {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        position => {
          const {latitude, longitude} = position.coords;
          resolve({latitude, longitude});
        },
        error => {
          console.error('Location error:', error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 1000,
        },
      );
    });
  }, []);

  // Calculate route between driver and pickup location
  const calculateRoute = useCallback(
    async (start: DriverLocation, end: PickupLocation) => {
      try {
        const routeInfo = await calculateRouteService(start, end);
        setRoutePoints(routeInfo.points);
        setDistance(routeInfo.distance);
        setEta(routeInfo.eta);
        setError(null); // Clear any previous errors
      } catch (error) {
        console.error('Route calculation error:', error);
        // Only set error if it's a critical failure, not API key issues
        if (error instanceof Error && !error.message.includes('API key')) {
          setError('Failed to calculate route');
        }
      }
    },
    [],
  );

  // Calculate distance between two points
  const calculateDistance = useCallback(
    (point1: DriverLocation, point2: PickupLocation): number => {
      const R = 6371; // Earth's radius in kilometers
      const dLat = ((point2.latitude - point1.latitude) * Math.PI) / 180;
      const dLon = ((point2.longitude - point1.longitude) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((point1.latitude * Math.PI) / 180) *
          Math.cos((point2.latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },
    [],
  );

  // Send location update to socket
  const sendLocationUpdate = useCallback(
    (location: DriverLocation, position: any) => {
      // Check connection status dynamically instead of relying on state
      const isConnected = socketService.getConnectionStatus();

      // Debug logging
      if (!isConnected) {
        console.log('⚠️ Socket not connected, skipping location update');
        return;
      }

      if (!orderId) {
        console.log('⚠️ OrderId not available, skipping location update');
        return;
      }

      if (!user?.idUser) {
        console.log('⚠️ User ID not available, skipping location update');
        return;
      }

      const now = Date.now();
      // Send location update every 5 seconds
      if (now - lastSocketLocationUpdate.current < 5000) {
        return;
      }

      const {latitude, longitude, accuracy, speed} = position.coords;

      const locationData = {
        orderId: typeof orderId === 'string' ? parseInt(orderId, 10) : orderId,
        deliveryAgentId: user.idUser as number,
        latitude: latitude,
        longitude: longitude,
        timestamp: now,
        orderStatus: 'ASSIGNED',
        accuracy: accuracy || 0,
        speed: speed || 0,
      };

      console.log('📤 Attempting to emit location_update:', locationData);

      try {
        const success = socketService.emit('location_update', locationData);

        if (success) {
          lastSocketLocationUpdate.current = now;
          Alert.alert('Location update sent to socket successfully');
        } else {
          console.warn(
            '⚠️ Failed to send location update to socket - emit returned false',
          );
        }
      } catch (err) {
        console.error('❌ Error sending location update:', err);
      }
    },
    [orderId, user?.idUser, socketService],
  );

  // Start location tracking with optimized debouncing
  const startLocationTracking = useCallback(() => {
    if (locationWatchId.current) {
      Geolocation.clearWatch(locationWatchId.current);
    }

    console.log('📍 Starting location tracking...');
    console.log('📍 Socket connected:', socketService.getConnectionStatus());
    console.log('📍 OrderId:', orderId);
    console.log('📍 User ID:', user?.idUser);

    locationWatchId.current = Geolocation.watchPosition(
      position => {
        const now = Date.now();
        const {latitude, longitude} = position.coords;
        const newLocation = {latitude, longitude};

        // Always send location update to socket every 5 seconds (regardless of distance change)
        sendLocationUpdate(newLocation, position);

        // Debounce UI location updates (minimum 5 seconds between updates)
        if (now - lastLocationUpdate.current < 5000) {
          return;
        }

        // Only update UI if location changed significantly (more than 100m)
        if (driverLocation) {
          const locationDistance = calculateDistance(newLocation, {
            latitude: driverLocation.latitude,
            longitude: driverLocation.longitude,
            name: '',
            address: '',
          });
          if (locationDistance < 0.1) {
            // Less than 100m - skip UI update but socket update already sent
            return;
          }
        }

        lastLocationUpdate.current = now;
        setDriverLocation(newLocation);

        // Update route only if driver location changes significantly (more than 500m)
        // and enough time has passed since last route update
        if (routePoints.length > 0 && now - lastRouteUpdate.current > 30000) {
          const distanceFromPickup = calculateDistance(
            newLocation,
            pickupLocation,
          );
          if (distanceFromPickup > 0.5) {
            // More than 500m from pickup
            lastRouteUpdate.current = now;
            calculateRoute(newLocation, pickupLocation);
          }
        }
      },
      err => {
        console.error('Location tracking error:', err);
        setError('Location tracking failed');
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 10, // Update every 10 meters (more frequent for socket updates)
        interval: 5000, // Update every 5 seconds for socket updates
      },
    );
  }, [
    driverLocation,
    routePoints,
    pickupLocation,
    calculateRoute,
    calculateDistance,
    sendLocationUpdate,
    socketService,
    orderId,
    user?.idUser,
  ]);

  // Initialize location and route
  const initializeLocation = useCallback(async () => {
    if (isInitialized.current) return;

    try {
      setIsLoading(true);
      setError(null);

      const hasPermission = await checkLocationPermission();
      if (!hasPermission) {
        setError('Location permission required');
        setIsLoading(false);
        return;
      }

      // Get initial location
      const currentLocation = await getCurrentLocation();
      setDriverLocation(currentLocation);

      // Calculate initial route
      await calculateRoute(currentLocation, pickupLocation);

      // Start tracking
      startLocationTracking();

      isInitialized.current = true;
      setIsLoading(false);
    } catch (error) {
      console.error('Initialization error:', error);
      setError('Failed to initialize location');
      setIsLoading(false);
    }
  }, [
    checkLocationPermission,
    getCurrentLocation,
    calculateRoute,
    pickupLocation,
    startLocationTracking,
  ]);

  // Handle call button press
  const handleCall = useCallback(() => {
    if (pickupLocation.phoneNumber) {
      Linking.openURL(`tel:${pickupLocation.phoneNumber}`);
    } else {
      Alert.alert('No phone number available');
    }
  }, [pickupLocation.phoneNumber]);

  // Handle map button press
  const handleOpenMaps = useCallback(() => {
    openExternalNavigation(pickupLocation, Platform.OS as 'ios' | 'android');
  }, [pickupLocation]);

  // Smoothly animate map to driver location
  const animateToDriverLocation = useCallback(() => {
    if (driverLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: driverLocation.latitude,
          longitude: driverLocation.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.0121,
        },
        1000, // 1 second animation
      );
    }
  }, [driverLocation]);

  // Swipe gesture handler for "Reached pickup" button
  const swipeGestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      console.log('Gesture started');
      // Simplified start - no haptic to avoid runOnJS conflicts
    },
    onActive: event => {
      try {
        if (!isSwipeComplete.value) {
          const newTranslateX = Math.max(
            0,
            Math.min(event.translationX, SWIPE_THRESHOLD),
          );
          swipeTranslateX.value = newTranslateX;
          console.log(
            'Gesture active - translationX:',
            event.translationX,
            'newTranslateX:',
            newTranslateX,
          );
        }
        // Removed progressive haptic feedback to prevent runOnJS conflicts
      } catch (error) {
        console.log('Gesture active error:', error);
      }
    },
    onEnd: () => {
      try {
        const currentTranslateX = swipeTranslateX.value;
        console.log('=== GESTURE END DEBUG ===');
        console.log('currentTranslateX:', currentTranslateX);
        console.log('SWIPE_THRESHOLD:', SWIPE_THRESHOLD);
        console.log('threshold (0.85):', SWIPE_THRESHOLD * 0.85);
        console.log('isSwipeComplete:', isSwipeComplete.value);

        if (currentTranslateX >= SWIPE_THRESHOLD * 0.85) {
          console.log(
            '✅ Gesture threshold reached, calling onReachedPickup...',
          );
          // Simplified success handling with error protection
          isSwipeComplete.value = true;
          swipeTranslateX.value = withTiming(SWIPE_THRESHOLD, {duration: 200});

          // Call function directly without animation callback
          try {
            console.log('About to call runOnJS(onReachedPickup)');
            runOnJS(onReachedPickup)();
          } catch (_error) {
            console.log('Error calling onReachedPickup:', _error);
          }
        } else {
          console.log('❌ Gesture did not reach threshold, resetting...');
          // Simplified reset with error protection
          swipeTranslateX.value = withTiming(0, {
            duration: 300,
            easing: Easing.out(Easing.cubic),
          });
        }
      } catch (error) {
        console.log('Gesture end error:', error);
        // Reset to safe state
        swipeTranslateX.value = 0;
      }
    },
  });

  // Simplified haptic feedback functions to avoid runOnJS conflicts
  const triggerHaptic = useCallback(
    (type: 'light' | 'medium' | 'success' | 'heavy') => {
      try {
        switch (type) {
          case 'light':
            Haptic.trigger('impactLight', {enableVibrateFallback: true});
            break;
          case 'medium':
            Haptic.trigger('impactMedium', {enableVibrateFallback: true});
            break;
          case 'success':
            Haptic.trigger('notificationSuccess', {
              enableVibrateFallback: true,
            });
            break;
          case 'heavy':
            Haptic.trigger('impactHeavy', {enableVibrateFallback: true});
            break;
        }
      } catch (error) {
        console.log('Haptic error:', error);
      }
    },
    [],
  );

  // Handle reached pickup confirmation - main function
  const onReachedPickup = useCallback(async () => {
    console.log('=== onReachedPickup called ===');
    console.log('Navigation object:', navigation);
    console.log('Route params:', route?.params);
    console.log('Pickup location:', pickupLocation);

    // Enhanced success haptic feedback
    triggerHaptic('success');
    Vibration.vibrate([0, 50, 100, 50, 100]);

    // Immediate navigation test - remove setTimeout to debug
    console.log('About to navigate immediately...');
    if (navigation) {
      try {
        console.log('Navigation object exists, calling navigate...');
        navigation.navigate('OrderDetails', {
          orderDetails: {
            orderId: route?.params?.orderId || 'ORDER_123456',
            customerName: 'John Doe',
            customerPhone: '+91-9876543210',
            customerAddress: '123 Main Street, Hyderabad, Telangana 500001',
            restaurantName: pickupLocation.name,
            restaurantAddress: pickupLocation.address,
            items: [
              {name: 'Chicken Biryani', quantity: 2, price: 180},
              {name: 'Mutton Curry', quantity: 1, price: 120},
              {name: 'Raita', quantity: 2, price: 40},
            ],
            totalAmount: 340,
            deliveryFee: 25,
            estimatedEarnings: 25,
            estimatedTime: '15-20 mins',
            specialInstructions:
              'Please call when you arrive. Ring the doorbell twice.',
          },
        });
        console.log('Navigation call completed');
      } catch (navError) {
        console.error('Navigation error:', navError);
        Alert.alert(
          'Navigation Error',
          `Failed to navigate: ${
            navError instanceof Error ? navError.message : 'Unknown error'
          }`,
        );
      }
    } else {
      console.error('Navigation object is null or undefined');
      Alert.alert('Navigation Error', 'Unable to navigate to order details');
    }
  }, [navigation, route?.params, pickupLocation, triggerHaptic]);

  // Animated styles for swipe button
  const swipeButtonStyle = useAnimatedStyle(() => {
    const progress = swipeTranslateX.value / SWIPE_THRESHOLD;
    const opacity = interpolate(
      progress,
      [0, 0.5, 1],
      [1, 0.8, 0.6],
      Extrapolate.CLAMP,
    );

    return {
      transform: [{translateX: swipeTranslateX.value}],
      opacity,
    };
  });

  const swipeTrackStyle = useAnimatedStyle(() => {
    const progress = swipeTranslateX.value / SWIPE_THRESHOLD;
    const backgroundColor = interpolate(
      progress,
      [0, 1],
      [0, 1], // Use numbers for interpolation
      Extrapolate.CLAMP,
    );

    return {
      backgroundColor: backgroundColor < 0.5 ? PRIMARY_GREEN : '#4ade80',
    };
  });

  // Initialize socket connection and monitor connection status
  useEffect(() => {
    // Monitor socket connection status
    const unsubscribe = socketService.onConnectionChange(connected => {
      console.log(
        'Socket connection status:',
        connected ? '🟢 Connected' : '🔴 Disconnected',
      );

      // If socket just connected and location tracking is initialized, log it
      if (connected && isInitialized.current) {
        console.log('✅ Socket connected - location updates will now be sent');
      }
    });

    // Connect socket if not already connected
    const connectSocket = async () => {
      if (
        !socketService.getConnectionStatus() &&
        user?.idUser &&
        user?.fkStoreId
      ) {
        try {
          await socketService.connect(undefined, {
            userId: user.idUser as number,
            userType: USER_TYPES.DELIVERY_PARTNER,
            storeId: user.fkStoreId as number,
          });
          console.log('✅ Socket connected for location tracking');
        } catch (error) {
          console.error('❌ Failed to connect socket:', error);
        }
      } else if (socketService.getConnectionStatus()) {
        console.log('✅ Socket already connected');
      }
    };

    connectSocket();

    return () => {
      unsubscribe();
    };
  }, [user?.idUser, user?.fkStoreId, socketService]);

  // Initialize on mount
  useEffect(() => {
    initializeLocation();

    return () => {
      if (locationWatchId.current) {
        Geolocation.clearWatch(locationWatchId.current);
      }
    };
  }, [initializeLocation]); // Include initializeLocation dependency

  // Occasionally animate map to driver location (every 30 seconds)
  useEffect(() => {
    if (!driverLocation) return;

    const interval = setInterval(() => {
      animateToDriverLocation();
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [driverLocation, animateToDriverLocation]); // Include animateToDriverLocation dependency

  // Handle back button
  const handleBack = useCallback(() => {
    navigation?.goBack();
  }, [navigation]);

  // Handle emergency button
  const handleEmergency = useCallback(() => {
    Alert.alert('Emergency', 'Call emergency services?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Call',
        onPress: () => Linking.openURL('tel:100'),
        style: 'destructive',
      },
    ]);
  }, []);

  // Handle support button
  const handleSupport = useCallback(() => {
    Alert.alert('Support', 'Contact support team?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Call Support',
        onPress: () => Linking.openURL('tel:+91-1800-123-456'),
      },
    ]);
  }, []);

  // Handle profile button
  const handleProfile = useCallback(() => {
    navigation?.navigate('Profile');
  }, [navigation]);

  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PRIMARY_GREEN} />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  // Render error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" size={48} color="#ef4444" />
        <Text style={styles.errorTitle}>Location Error</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={initializeLocation}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <Icon name="chevron-left" size={24} color="#374151" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Reach pickup</Text>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleEmergency}>
            <Icon name="bell-alert" size={20} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleSupport}>
            <Icon name="help-circle" size={20} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleProfile}>
            <Icon name="account" size={20} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={mapRegion}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass={false}
          showsScale={false}
          showsBuildings={true}
          showsTraffic={true}
          showsIndoors={false}
          mapType="standard"
          onRegionChangeComplete={_region => {
            // Optional: Handle region changes
          }}>
          {/* Driver location marker */}
          {driverLocation && (
            <>
              <Marker
                coordinate={driverLocation}
                title="Your Location"
                description="Driver location">
                <View style={styles.driverMarker}>
                  <View style={styles.driverMarkerInner} />
                </View>
              </Marker>
              <Circle
                center={driverLocation}
                radius={400}
                strokeColor={PRIMARY_GREEN}
                fillColor="rgba(0,168,107,0.1)"
                strokeWidth={2}
              />
            </>
          )}

          {/* Pickup location marker */}
          <Marker
            coordinate={pickupLocation}
            title={pickupLocation.name}
            description={pickupLocation.address}>
            <View style={styles.pickupMarker}>
              <Icon name="silverware-fork-knife" size={24} color="white" />
            </View>
          </Marker>

          {/* Route polyline */}
          {routePoints.length > 1 && (
            <Polyline
              coordinates={routePoints}
              strokeColor={PRIMARY_GREEN}
              strokeWidth={4}
              lineDashPattern={[8, 6]}
            />
          )}
        </MapView>

        {/* Map controls */}
        <View style={styles.mapControls}>
          <TouchableOpacity
            style={styles.mapControlButton}
            onPress={animateToDriverLocation}>
            <Icon name="crosshairs-gps" size={20} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* Swipe handle */}
        <View style={styles.swipeHandle} />
      </View>

      {/* Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={['35%', '75%']}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.bottomSheetIndicator}>
        <BottomSheetView style={styles.bottomSheetContent}>
          {/* Pickup details */}
          <View style={styles.pickupDetails}>
            <View style={styles.pickupTag}>
              <Text style={styles.pickupTagText}>Pick up</Text>
            </View>

            <Text style={styles.restaurantName}>{pickupLocation.name}</Text>
            <Text style={styles.restaurantAddress}>
              {pickupLocation.address}
            </Text>

            {/* ETA and distance */}
            {(eta || distance) && (
              <View style={styles.etaContainer}>
                <View style={styles.etaItem}>
                  <Icon name="clock-outline" size={16} color="#6b7280" />
                  <Text style={styles.etaText}>{eta}</Text>
                </View>
                <View style={styles.etaItem}>
                  <Icon name="map-marker-distance" size={16} color="#6b7280" />
                  <Text style={styles.etaText}>{distance}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Action buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.callButton} onPress={handleCall}>
              <Icon name="phone" size={20} color="#374151" />
              <Text style={styles.callButtonText}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.mapButton} onPress={handleOpenMaps}>
              <Icon name="navigation" size={20} color="white" />
              <Text style={styles.mapButtonText}>Map</Text>
            </TouchableOpacity>
          </View>

          {/* Test button for debugging */}
          <TouchableOpacity style={styles.testButton} onPress={onReachedPickup}>
            <Text style={styles.testButtonText}>Reached pickup</Text>
          </TouchableOpacity>

          {/* Swipe to confirm button */}
          {/* <View style={styles.swipeContainer}>
            <Animated.View style={[styles.swipeTrack, swipeTrackStyle]}>
              <Text style={styles.swipeText}>Reached pickup</Text>
              <PanGestureHandler onGestureEvent={swipeGestureHandler}>
                <Animated.View style={[styles.swipeThumb, swipeButtonStyle]}>
                  <Icon name="arrow-right" size={20} color={PRIMARY_GREEN} />
                </Animated.View>
              </PanGestureHandler>
            </Animated.View>
          </View> */}
        </BottomSheetView>
      </BottomSheet>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    fontFamily: Fonts.Medium,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontFamily: Fonts.SemiBold,
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: PRIMARY_GREEN,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: Fonts.SemiBold,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
    paddingBottom: 16,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: Fonts.SemiBold,
    color: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  driverMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: PRIMARY_GREEN,
    borderWidth: 3,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  driverMarkerInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  pickupMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PRIMARY_GREEN,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  mapControls: {
    position: 'absolute',
    right: 16,
    bottom: 120,
    gap: 8,
  },
  mapControlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  swipeHandle: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#d1d5db',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  bottomSheetBackground: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  bottomSheetIndicator: {
    backgroundColor: '#d1d5db',
    width: 40,
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  pickupDetails: {
    marginBottom: 20,
  },
  pickupTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  pickupTagText: {
    color: 'white',
    fontSize: 12,
    fontFamily: Fonts.SemiBold,
  },
  restaurantName: {
    fontSize: 20,
    fontFamily: Fonts.Bold,
    color: '#111827',
    marginBottom: 4,
  },
  restaurantAddress: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  etaContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  etaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  etaText: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: Fonts.Medium,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: 'white',
  },
  callButtonText: {
    fontSize: 16,
    fontFamily: Fonts.SemiBold,
    color: '#374151',
  },
  mapButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#111827',
  },
  mapButtonText: {
    fontSize: 16,
    fontFamily: Fonts.SemiBold,
    color: 'white',
  },
  testButton: {
    backgroundColor: PRIMARY_GREEN,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  testButtonText: {
    color: 'white',
    fontSize: 14,
    fontFamily: Fonts.SemiBold,
  },
  swipeContainer: {
    marginBottom: 20,
  },
  swipeTrack: {
    height: 56,
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  swipeText: {
    color: 'white',
    fontSize: 16,
    fontFamily: Fonts.SemiBold,
  },
  swipeThumb: {
    position: 'absolute',
    left: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default PickupNavigationScreen;
