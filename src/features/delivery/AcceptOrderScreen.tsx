import React, {useCallback, useMemo, useRef, useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Platform,
  Animated as RNAnimated,
  Easing,
  Alert,
} from 'react-native';
import MapView, {Marker, PROVIDER_GOOGLE} from 'react-native-maps';
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
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Fonts} from '@utils/Constants';
import Geolocation from '@react-native-community/geolocation';
import {watchLocation, clearLocationWatch} from '@service/directionsService';
import {useWS, OrderAssignmentRequest} from '@service/WsProvider';
import {useSelector} from 'react-redux';
import type {RootState} from '@state/store';

Geolocation.setRNConfiguration?.({
  skipPermissionRequests: false,
  authorizationLevel: 'always',
  locationProvider: 'auto',
  enableBackgroundLocationUpdates: true,
});

type Props = {
  route?: any;
  navigation?: any;
};

const {width, height} = Dimensions.get('window');
const PRIMARY_GREEN = '#00A86B';
const ACCEPT_THRESHOLD = width * 0.7; // 70%

const AcceptOrderScreen: React.FC<Props> = ({navigation, route}) => {
  // Get order data from route params
  const orderData: OrderAssignmentRequest | undefined =
    route?.params?.orderData;
  const socketService = useWS();
  const user = useSelector((state: RootState) => state.auth.user);

  const [accepted, setAccepted] = useState(false);
  const [showOrderUI, setShowOrderUI] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [orderResponse, setOrderResponse] = useState<any>(null);
  const [driverLocation, setDriverLocation] = useState({
    latitude: route?.params?.driverLat ?? 17.442,
    longitude: route?.params?.driverLng ?? 78.391,
  });

  console.log('driverLocation', driverLocation);
  console.log('orderData', orderData);

  const [watchId, setWatchId] = useState<number | null>(null);
  const slideAnim = useRef(new RNAnimated.Value(0)).current;
  const fadeAnim = useRef(new RNAnimated.Value(0)).current;
  const scaleAnim = useRef(new RNAnimated.Value(0.95)).current;

  const driverRegion = useMemo(
    () => ({
      latitude: driverLocation.latitude,
      longitude: driverLocation.longitude,
      latitudeDelta: 0.015,
      longitudeDelta: 0.0121,
    }),
    [driverLocation.latitude, driverLocation.longitude],
  );

  // Swipe to accept values
  const translateX = useSharedValue(0);

  const slideUpOrderUI = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setShowOrderUI(true);

    // Smooth fade in and scale animation for Order UI
    RNAnimated.parallel([
      RNAnimated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      RNAnimated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
    ]).start();

    // Order UI slide up with spring animation
    RNAnimated.timing(slideAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Complete animation after delay
    setTimeout(() => {
      setIsAnimating(false);
    }, 550);
  }, [slideAnim, fadeAnim, scaleAnim, isAnimating]);

  const slideDownOrderUI = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);

    // Smooth fade out and scale down animation
    RNAnimated.parallel([
      RNAnimated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      RNAnimated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Order UI slide down with spring animation
    setTimeout(() => {
      RNAnimated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setShowOrderUI(false);
        setIsAnimating(false);
      });
    }, 100);
  }, [slideAnim, fadeAnim, scaleAnim, isAnimating]);

  const onAccept = useCallback(async () => {
    console.log(
      'onAccept called - accepted:',
      accepted,
      'isAnimating:',
      isAnimating,
    );
    if (accepted || isAnimating || !orderData) return;
    setAccepted(true);
    console.log('Order accepted, sending response...');

    // Send accept response via socket
    const success = socketService.sendOrderAssignmentResponse({
      orderId: orderData.orderId,
      deliveryAgentId: user?.idUser as number,
      response: 'ACCEPT',
      message: 'I will deliver this order',
    });

    if (!success) {
      Alert.alert(
        'Error',
        'Failed to send response. Please check your connection.',
      );
      setAccepted(false);
      return;
    }

    console.log('✅ Accept response sent successfully');

    // Success animation with scale and fade
    RNAnimated.parallel([
      RNAnimated.timing(scaleAnim, {
        toValue: 1.05,
        duration: 150,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      RNAnimated.timing(fadeAnim, {
        toValue: 0.8,
        duration: 150,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Reset and then slide down
      RNAnimated.parallel([
        RNAnimated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        RNAnimated.timing(fadeAnim, {
          toValue: 1,
          duration: 100,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    });

    // Wait for response before navigating
    // The navigation will be handled in the onOrderAssignmentResponse listener
  }, [
    accepted,
    isAnimating,
    orderData,
    socketService,
    user,
    scaleAnim,
    fadeAnim,
  ]);

  const panHandler = useAnimatedGestureHandler({
    onStart: () => {
      console.log('Gesture started');
      // Simplified start - no haptic to avoid runOnJS conflicts
    },
    onActive: e => {
      try {
        const newTranslateX = Math.max(
          0,
          Math.min(e.translationX, ACCEPT_THRESHOLD),
        );
        translateX.value = newTranslateX;
        // Removed progressive haptic feedback to prevent runOnJS conflicts
      } catch (error) {
        console.log('Gesture active error:', error);
      }
    },
    onEnd: () => {
      try {
        const currentTranslateX = translateX.value;
        console.log(
          'Gesture ended - currentTranslateX:',
          currentTranslateX,
          'threshold:',
          ACCEPT_THRESHOLD * 0.85,
        );
        if (currentTranslateX >= ACCEPT_THRESHOLD * 0.85) {
          console.log('Gesture threshold reached, calling onAccept...');
          // Simplified success handling with error protection
          translateX.value = withTiming(
            ACCEPT_THRESHOLD,
            {duration: 200},
            () => {
              try {
                console.log('About to call runOnJS(onAccept)');
                runOnJS(onAccept)();
              } catch (_error) {
                console.log('Error calling onAccept:', _error);
              }
            },
          );
        } else {
          // Simplified reset with error protection
          translateX.value = withTiming(0, {
            duration: 300,
            easing: Easing.out(Easing.cubic),
          });
        }
      } catch (error) {
        console.log('Gesture end error:', error);
        // Reset to safe state
        translateX.value = 0;
      }
    },
  });

  const swipeIconStyle = useAnimatedStyle(() => ({
    transform: [{translateX: translateX.value}],
  }));

  const swipeTrackStyle = useAnimatedStyle(() => {
    const progress = translateX.value / ACCEPT_THRESHOLD;
    return {
      backgroundColor: progress > 0.5 ? '#4ade80' : PRIMARY_GREEN,
    };
  });

  const swipeTextStyle = useAnimatedStyle(() => {
    const progress = translateX.value / ACCEPT_THRESHOLD;
    return {
      opacity: progress > 0.3 ? 0.7 : 1,
    };
  });

  const onDeny = useCallback(() => {
    if (isAnimating || !orderData) return;

    // Send reject response via socket
    const success = socketService.sendOrderAssignmentResponse({
      orderId: orderData.orderId,
      deliveryAgentId: user?.idUser as number,
      response: 'REJECT',
      message: 'Currently unavailable',
    });

    if (success) {
      console.log('❌ Reject response sent successfully');
    } else {
      Alert.alert(
        'Error',
        'Failed to send response. Please check your connection.',
      );
    }

    slideDownOrderUI();
    setTimeout(() => {
      import('@utils/NavigationUtils').then(({goBack}) => {
        goBack().catch(_error => {
          navigation?.goBack?.();
        });
      });
    }, 600);
  }, [
    navigation,
    slideDownOrderUI,
    isAnimating,
    orderData,
    socketService,
    user,
  ]);

  // Listen for order assignment responses
  useEffect(() => {
    if (!orderData) return;

    const unsubscribe = socketService.onOrderAssignmentResponse(data => {
      console.log('📥 Order assignment response received:', data);
      setOrderResponse(data);

      if (data.type === 'ASSIGNED') {
        // Order was successfully assigned
        Alert.alert(
          '✅ Success',
          `Order ${data.orderId} has been assigned to you!`,
          [
            {
              text: 'OK',
              onPress: () => {
                slideDownOrderUI();
                setTimeout(() => {
                  if (navigation && orderData) {
                    // Navigate to PickupNavigation with order data
                    const pickupLat = orderData.orderInfo.latitude
                      ? parseFloat(orderData.orderInfo.latitude)
                      : 17.43869444638263;
                    const pickupLng = orderData.orderInfo.longitude
                      ? parseFloat(orderData.orderInfo.longitude)
                      : 78.39538337328888;

                    navigation.navigate('PickupNavigation', {
                      pickupLocation: {
                        latitude: pickupLat,
                        longitude: pickupLng,
                        name: 'Store Location',
                        address: orderData.orderInfo.formattedAddress,
                        phoneNumber: '+91-9876543210',
                      },
                      driverLocation: driverLocation,
                      orderId: orderData.orderId.toString(),
                      orderNumber: orderData.orderNumber,
                    });
                  }
                }, 600);
              },
            },
          ],
        );
      } else if (data.type === 'DECLINED') {
        Alert.alert('ℹ️ Info', `Order ${data.orderId} was declined.`);
        // Navigate back
        setTimeout(() => {
          navigation?.goBack?.();
        }, 1000);
      } else if (data.type === 'ALREADY_ASSIGNED') {
        Alert.alert(
          '⚠️ Oops',
          `Order ${data.orderId} was already assigned to another agent.`,
        );
        // Navigate back
        setTimeout(() => {
          navigation?.goBack?.();
        }, 1000);
      }
    });

    return () => {
      // Cleanup is handled by the socket service
    };
  }, [orderData, socketService, navigation, driverLocation, slideDownOrderUI]);

  useEffect(() => {
    // Show order UI when order data is available
    if (orderData) {
      const timer = setTimeout(() => {
        slideUpOrderUI();
      }, 500);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [orderData, slideUpOrderUI]);

  useEffect(() => {
    // Cleanup animations on unmount
    return () => {
      slideAnim.stopAnimation();
      fadeAnim.stopAnimation();
      scaleAnim.stopAnimation();
    };
  }, [slideAnim, fadeAnim, scaleAnim]);

  useEffect(() => {
    // First get current position to ensure permissions are granted
    const getInitialLocation = () => {
      Geolocation.getCurrentPosition(
        position => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };

          setDriverLocation(location);

          // Now start watching for location changes
          startWatchingLocation();
        },
        _error => {
          if (_error.code === 1) {
            // Permission denied
            Alert.alert(
              'Permission Denied',
              'Location permission is required. Please enable location access in your device settings.',
              [{text: 'OK'}],
            );
          } else if (_error.code === 2) {
            // Position unavailable
            Alert.alert(
              'Location Unavailable',
              'Unable to get your current location. Please check your location settings.',
              [{text: 'OK'}],
            );
          } else {
            Alert.alert(
              'Location Error',
              `Failed to get initial location: ${_error.message}`,
              [{text: 'OK'}],
            );
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 1000,
        },
      );
    };

    // Start watching location changes
    const startWatchingLocation = () => {
      const id = watchLocation(
        location => {
          console.log('Location updated:', location);
          setDriverLocation(location);
        },
        _error => {
          if (_error.code === 1) {
            // Permission denied
            Alert.alert(
              'Permission Denied',
              'Location permission is required. Please enable location access in your device settings.',
              [{text: 'OK'}],
            );
          } else if (_error.code === 2) {
            // Position unavailable
            Alert.alert(
              'Location Unavailable',
              'Unable to get your current location. Please check your location settings.',
              [{text: 'OK'}],
            );
          } else {
            Alert.alert(
              'Location Error',
              `Failed to watch location: ${_error.message}`,
              [{text: 'OK'}],
            );
          }
        },
      );
      setWatchId(id);
    };

    // Get initial location first, then start watching
    getInitialLocation();

    // Cleanup function to stop watching when component unmounts
    return () => {
      if (watchId !== null) {
        console.log('Clearing location watch...');
        clearLocationWatch(watchId);
      }
    };
  }, [watchId]);

  return (
    <GestureHandlerRootView style={styles.gestureContainer}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {/* 
          Enhanced MapView: 
          - Shows driver's current location
          - Finds nearest store from a list of stores (based on latitude/longitude)
          - Draws route (polyline) from driver to nearest store
        */}

        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={driverRegion}
          region={driverRegion}
          showsUserLocation={true}
          showsMyLocationButton={false}
          userLocationCalloutEnabled={true}
          userLocationPriority="high"
          showsTraffic={false}
          pitchEnabled={false}
          followsUserLocation={true}
          showsCompass={true}
          showsBuildings={false}
          showsIndoors={false}
          showsScale={false}
          showsIndoorLevelPicker={false}>
          {/* Marker for current driver location */}
          <Marker
            coordinate={{
              latitude: driverLocation.latitude,
              longitude: driverLocation.longitude,
            }}
            title="My Location"
            pinColor="purple"
            anchor={{x: 0.5, y: 0.5}}
            centerOffset={{x: 0, y: 0}}>
            <View style={styles.markerContainer}>
              <Icon name="motorbike" size={32} color="purple" />
            </View>
          </Marker>

          {/* Store location marker */}
          {orderData?.orderInfo?.latitude &&
            orderData?.orderInfo?.longitude && (
              <Marker
                coordinate={{
                  latitude: parseFloat(orderData.orderInfo.latitude),
                  longitude: parseFloat(orderData.orderInfo.longitude),
                }}
                title="Store Location"
                pinColor="red"
                anchor={{x: 0.5, y: 0.5}}
                centerOffset={{x: 0, y: 0}}>
                <View style={styles.markerContainer}>
                  <Icon name="store" size={32} color="red" />
                </View>
              </Marker>
            )}
        </MapView>

        <TouchableOpacity
          style={styles.denyBtn}
          onPress={onDeny}
          activeOpacity={0.8}>
          <Text style={styles.denyText}>× Deny</Text>
        </TouchableOpacity>

        {/* Order UI - slides up from bottom */}
        {showOrderUI && (
          <RNAnimated.View
            style={[
              styles.orderUIContainer,
              {
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [height * 0.55, 0],
                    }),
                  },
                ],
              },
            ]}>
            <View style={styles.orderContent}>
              <View style={styles.newOrderPill}>
                <Text style={styles.newOrderText}>New order</Text>
              </View>

              <Text style={styles.earningsLabel}>Estimated earnings</Text>
              <Text style={styles.amount}>
                ₹{orderData?.orderInfo?.totalAmount || '0'}
              </Text>
              <Text style={styles.distances}>
                Order #{orderData?.orderNumber || 'N/A'}
              </Text>

              <View style={styles.card}>
                <View style={styles.pickupTag}>
                  <Text style={styles.pickupTagText}>Pick up</Text>
                </View>
                <Text style={styles.restaurant}>
                  {orderData?.orderInfo?.formattedAddress
                    ? 'Store Location'
                    : 'Store Location'}
                </Text>
                <Text style={styles.address}>
                  {orderData?.orderInfo?.formattedAddress ||
                    'Address not available'}
                </Text>
                {orderData?.orderInfo?.latitude &&
                  orderData?.orderInfo?.longitude && (
                    <View style={styles.row}>
                      <Icon name="map-marker" size={18} color="#6B7280" />
                      <Text style={styles.away}>
                        {' '}
                        {orderData.orderInfo.latitude},{' '}
                        {orderData.orderInfo.longitude}
                      </Text>
                    </View>
                  )}
              </View>

              <View style={styles.swipeContainer}>
                <Animated.View style={[styles.swipeTrack, swipeTrackStyle]}>
                  <Animated.Text style={[styles.acceptText, swipeTextStyle]}>
                    Accept order
                  </Animated.Text>
                  <PanGestureHandler
                    onGestureEvent={panHandler}
                    activeOffsetX={[-10, 10]}
                    activeOffsetY={[-5, 5]}
                    shouldCancelWhenOutside={false}>
                    <Animated.View style={[styles.swipeThumb, swipeIconStyle]}>
                      <Icon
                        name="arrow-right"
                        size={22}
                        color={PRIMARY_GREEN}
                      />
                    </Animated.View>
                  </PanGestureHandler>
                </Animated.View>
              </View>
            </View>
          </RNAnimated.View>
        )}
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  gestureContainer: {flex: 1},
  container: {flex: 1},
  map: {
    flex: 1,
    width: '100%',
  },
  denyBtn: {
    position: 'absolute',
    top: Platform.select({ios: 54, android: 24}),
    right: 16,
    backgroundColor: '#111827',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    zIndex: 20,
  },
  denyText: {color: 'white', fontFamily: Fonts.Medium},
  orderUIContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.45,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: {width: 0, height: -5},
    elevation: 10,
    zIndex: 10,
  },
  orderContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
  },
  newOrderPill: {
    alignSelf: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: PRIMARY_GREEN,
    marginBottom: 8,
  },
  newOrderText: {color: PRIMARY_GREEN, fontFamily: Fonts.SemiBold},
  earningsLabel: {textAlign: 'center', color: '#6B7280', marginTop: 8},
  amount: {
    textAlign: 'center',
    fontSize: 34,
    fontFamily: Fonts.Bold,
    color: '#111827',
  },
  distances: {textAlign: 'center', color: '#6B7280', marginTop: 6},
  card: {
    backgroundColor: 'white',
    marginTop: 16,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 4},
    elevation: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  pickupTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#111827',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pickupTagText: {color: 'white', fontFamily: Fonts.Medium, fontSize: 12},
  restaurant: {
    marginTop: 10,
    fontFamily: Fonts.SemiBold,
    fontSize: 16,
    color: '#111827',
  },
  address: {marginTop: 4, color: '#4B5563'},
  row: {flexDirection: 'row', alignItems: 'center', marginTop: 8},
  away: {color: '#6B7280'},
  swipeContainer: {marginTop: 18},
  swipeTrack: {
    height: 56,
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 28,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  acceptText: {
    textAlign: 'center',
    color: 'white',
    fontFamily: Fonts.SemiBold,
    fontSize: 16,
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
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AcceptOrderScreen;
