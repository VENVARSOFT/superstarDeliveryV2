import React, {useCallback, useState, useMemo, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Platform,
  Vibration,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
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
  Easing,
} from 'react-native-reanimated';
import Haptic from 'react-native-haptic-feedback';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Geolocation from '@react-native-community/geolocation';
import {Fonts} from '@utils/Constants';
import {useSelector} from 'react-redux';
import type {RootState} from '@state/store';
import {getOrderDetails, OrderDetailsResponse} from '@service/orderService';
import {useWS} from '@service/WsProvider';
import {USER_TYPES} from '@service/config';

type Props = {
  route?: any;
  navigation?: any;
};

const {width} = Dimensions.get('window');
const PRIMARY_GREEN = '#00A86B';
const SWIPE_THRESHOLD = width * 0.7; // 70%

const OrderDetailsScreen: React.FC<Props> = ({navigation, route}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<OrderDetailsResponse['data'] | null>(null);

  // Get user from Redux
  const user = useSelector((state: RootState) => state.auth.user);

  // Socket service
  const socketService = useWS();

  // Swipe to confirm values
  const translateX = useSharedValue(0);

  // Get orderId from route params - can be passed as orderId or idOrder
  const orderId =
    route?.params?.orderId ||
    route?.params?.idOrder ||
    route?.params?.orderDetails?.orderId ||
    route?.params?.orderDetails?.idOrder;

  // Fetch order details from API
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId || !user?.idUser) {
        setError('Order ID or User ID is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await getOrderDetails(
          typeof orderId === 'string' ? parseInt(orderId, 10) : orderId,
          user.idUser,
        );
        console.log('Order details response:', response);

        if (response && response.success && response.data) {
          setOrderData(response.data);
        } else {
          setError(response?.error || 'Failed to fetch order details');
        }
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError('An error occurred while fetching order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, user?.idUser]);

  // Initialize socket connection and monitor connection status
  useEffect(() => {
    // Monitor socket connection status
    const unsubscribe = socketService.onConnectionChange(connected => {
      console.log(
        'Socket connection status:',
        connected ? '🟢 Connected' : '🔴 Disconnected',
      );
    });

    // Connect socket if not already connected
    const connectSocket = async () => {
      if (!socketService.getConnectionStatus() && user?.idUser) {
        try {
          // Note: fkStoreId might not be in Redux User interface
          // If socket connection requires storeId, you may need to get it from orderData
          const storeId = orderData?.fkIdStoreDelivery || orderData?.storeDTO?.idStore;
          
          if (storeId) {
            await socketService.connect(undefined, {
              userId: user.idUser as number,
              userType: USER_TYPES.DELIVERY_PARTNER,
              storeId: storeId as number,
            });
            console.log('✅ Socket connected for order details');
          } else {
            console.log('⚠️ Store ID not available, socket may already be connected');
          }
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
  }, [user?.idUser, orderData?.fkIdStoreDelivery, orderData?.storeDTO?.idStore, socketService]);

  // Transform API data to UI format
  const orderDetails = useMemo(() => {
    if (!orderData) {
      return null;
    }

    // Format customer name from customerDTO or use default
    const customerName =
      orderData.customerDTO?.nmFirst && orderData.customerDTO?.nmLast
        ? `${orderData.customerDTO.nmFirst} ${orderData.customerDTO.nmLast}`
        : orderData.customerDTO?.nmFirst || 'Customer';

    // Format customer phone
    const customerPhone = orderData.deliveryAddress?.txPhone || 'N/A';

    // Format customer address
    const addressParts = [
      orderData.deliveryAddress?.txAddressLine1,
      orderData.deliveryAddress?.txAddressLine2,
      orderData.deliveryAddress?.txLandmark,
      orderData.deliveryAddress?.txCity,
      orderData.deliveryAddress?.txState,
      orderData.deliveryAddress?.txPostalCode,
    ].filter(Boolean);
    const customerAddress = addressParts.join(', ') || orderData.txFormattedAddress || 'N/A';

    // Format restaurant name and address
    const restaurantName = orderData.storeDTO?.nmStore || 'Restaurant';
    const restaurantAddress = orderData.storeDTO?.txAddress || 'N/A';

    // Transform order items
    const items = orderData.orderItems.map(item => ({
      name: item.txProductName,
      quantity: item.nbQuantity,
      price: item.nbPrice,
    }));

    // Calculate estimated time (you can adjust this logic)
    const estimatedTime = '15-20 mins'; // You can calculate this based on deliverySlot or other data

    return {
      orderId: orderData.txOrderNumber || `#${orderData.idOrder}`,
      customerName,
      customerPhone,
      customerAddress,
      restaurantName,
      restaurantAddress,
      items,
      totalAmount: orderData.nbTotalAmount,
      deliveryFee: orderData.nbDeliveryCharge,
      estimatedEarnings: orderData.nbDeliveryCharge, // You can adjust this
      estimatedTime,
      specialInstructions: orderData.deliveryAddress?.txLandmark || null,
      status: orderData.status,
    };
  }, [orderData]);

  // Simplified haptic feedback functions
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

  // Get current location
  const getCurrentLocation = useCallback((): Promise<{latitude: number; longitude: number}> => {
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

  // Send location update to socket
  const sendLocationUpdate = useCallback(
    (
      location: {latitude: number; longitude: number},
      position: any,
      orderStatus: 'ASSIGNED' | 'IN_TRANSIT' | 'REACHED' | 'PICKED' = 'IN_TRANSIT',
      forceSend: boolean = false,
    ) => {
      // Check connection status dynamically
      const isConnected = socketService.getConnectionStatus();

      // Debug logging
      if (!isConnected) {
        console.log('⚠️ Socket not connected, skipping location update');
        return;
      }

      // Use orderId from orderData if available, otherwise from route params
      const currentOrderId = orderData?.idOrder || orderId;
      if (!currentOrderId) {
        console.log('⚠️ OrderId not available, skipping location update');
        return;
      }

      if (!user?.idUser) {
        console.log('⚠️ User ID not available, skipping location update');
        return;
      }

      // Extract coordinates from position or use location directly
      const latitude = position?.coords?.latitude ?? location.latitude;
      const longitude = position?.coords?.longitude ?? location.longitude;
      const accuracy = position?.coords?.accuracy ?? 0;
      const speed = position?.coords?.speed ?? 0;
      const now = Date.now();

      const locationData = {
        orderId: typeof currentOrderId === 'string' ? parseInt(currentOrderId, 10) : currentOrderId,
        deliveryAgentId: user.idUser as number,
        latitude: latitude,
        longitude: longitude,
        timestamp: now,
        orderStatus: orderStatus,
        accuracy: accuracy || 0,
        speed: speed || 0,
      };

      console.log(`📤 Attempting to emit location_update with status ${orderStatus}:`, locationData);

      try {
        const success = socketService.emit('location_update', locationData);

        if (success) {
          console.log(`✅ Location update sent successfully with status: ${orderStatus}`);
        } else {
          console.warn(
            '⚠️ Failed to send location update to socket - emit returned false',
          );
        }
      } catch (err) {
        console.error('❌ Error sending location update:', err);
      }
    },
    [orderId, orderData?.idOrder, user?.idUser, socketService],
  );

  const onPickedUp = useCallback(async () => {
    console.log('=== onPickedUp called ===');
    console.log('Order picked up confirmed');
    if (isAnimating || !orderData) return;
    setIsAnimating(true);

    // Get current location to send with PICKED status
    try {
      const currentLocation = await getCurrentLocation();
      
      // Send location update with PICKED status immediately (force send)
      sendLocationUpdate(
        currentLocation,
        {coords: {latitude: currentLocation.latitude, longitude: currentLocation.longitude}},
        'PICKED',
        true, // forceSend = true to bypass any throttling
      );
      
      console.log('✅ PICKED status sent with current coordinates');
    } catch (error) {
      console.error('❌ Error getting current location for PICKED status:', error);
      // If we can't get location, still try to send with default coordinates
      // You might want to use orderData coordinates as fallback
      if (orderData?.txLatitude && orderData?.txLongitude) {
        sendLocationUpdate(
          {
            latitude: parseFloat(orderData.txLatitude),
            longitude: parseFloat(orderData.txLongitude),
          },
          null,
          'PICKED',
          true,
        );
      }
    }

    // Enhanced success haptic feedback
    triggerHaptic('success');
    Vibration.vibrate([0, 50, 100, 50, 100]);

    // Navigate to drop order screen
    setTimeout(() => {
      navigation?.navigate('DropOrder', {
        orderDetails: orderDetails,
        orderId: orderId,
      });
      setIsAnimating(false);
    }, 800);
  }, [navigation, orderDetails, orderId, orderData, isAnimating, triggerHaptic, getCurrentLocation, sendLocationUpdate]);

  const panHandler = useAnimatedGestureHandler({
    onStart: () => {
      console.log('Gesture started');
    },
    onActive: e => {
      try {
        const newTranslateX = Math.max(
          0,
          Math.min(e.translationX, SWIPE_THRESHOLD),
        );
        translateX.value = newTranslateX;
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
          SWIPE_THRESHOLD * 0.85,
        );
        if (currentTranslateX >= SWIPE_THRESHOLD * 0.85) {
          console.log('Gesture threshold reached, calling onPickedUp...');
          translateX.value = withTiming(
            SWIPE_THRESHOLD,
            {duration: 200},
            () => {
              try {
                console.log('About to call runOnJS(onPickedUp)');
                runOnJS(onPickedUp)();
              } catch (_error) {
                console.log('Error calling onPickedUp:', _error);
              }
            },
          );
        } else {
          translateX.value = withTiming(0, {
            duration: 300,
            easing: Easing.out(Easing.cubic),
          });
        }
      } catch (error) {
        console.log('Gesture end error:', error);
        translateX.value = 0;
      }
    },
  });

  const swipeIconStyle = useAnimatedStyle(() => ({
    transform: [{translateX: translateX.value}],
  }));

  const swipeTrackStyle = useAnimatedStyle(() => {
    const progress = translateX.value / SWIPE_THRESHOLD;
    return {
      backgroundColor: progress > 0.5 ? '#4ade80' : PRIMARY_GREEN,
    };
  });

  const swipeTextStyle = useAnimatedStyle(() => {
    const progress = translateX.value / SWIPE_THRESHOLD;
    return {
      opacity: progress > 0.3 ? 0.7 : 1,
    };
  });

  const handleBack = useCallback(() => {
    navigation?.goBack();
  }, [navigation]);

  const handleCallCustomer = useCallback(() => {
    // Implement call customer functionality
    if (orderDetails?.customerPhone) {
      console.log('Calling customer:', orderDetails.customerPhone);
      // You can use Linking.openURL(`tel:${orderDetails.customerPhone}`) here
    }
  }, [orderDetails?.customerPhone]);

  const handleCallRestaurant = useCallback(() => {
    // Implement call restaurant functionality
    if (orderData?.storeDTO?.txPhone) {
      console.log('Calling restaurant:', orderData.storeDTO.txPhone);
      // You can use Linking.openURL(`tel:${orderData.storeDTO.txPhone}`) here
    }
  }, [orderData?.storeDTO?.txPhone]);

  // Show loading state
  if (loading) {
    return (
      <GestureHandlerRootView style={styles.gestureContainer}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
              <Icon name="chevron-left" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Order Details</Text>
            <View style={styles.headerActions} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={PRIMARY_GREEN} />
            <Text style={styles.loadingText}>Loading order details...</Text>
          </View>
        </View>
      </GestureHandlerRootView>
    );
  }

  // Show error state
  if (error || !orderDetails) {
    return (
      <GestureHandlerRootView style={styles.gestureContainer}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
              <Icon name="chevron-left" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Order Details</Text>
            <View style={styles.headerActions} />
          </View>
          <View style={styles.errorContainer}>
            <Icon name="alert-circle" size={48} color="#EF4444" />
            <Text style={styles.errorText}>
              {error || 'Failed to load order details'}
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                if (orderId && user?.idUser) {
                  setLoading(true);
                  setError(null);
                  getOrderDetails(
                    typeof orderId === 'string' ? parseInt(orderId, 10) : orderId,
                    user.idUser,
                  )
                    .then(response => {
                      if (response && response.success && response.data) {
                        setOrderData(response.data);
                      } else {
                        setError(response?.error || 'Failed to fetch order details');
                      }
                    })
                    .catch(err => {
                      console.error('Error fetching order details:', err);
                      setError('An error occurred while fetching order details');
                    })
                    .finally(() => {
                      setLoading(false);
                    });
                }
              }}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.gestureContainer}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
            <Icon name="chevron-left" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleCallCustomer}>
              <Icon name="phone" size={20} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}>
          {/* Order Status Card */}
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <View style={styles.statusTag}>
                <Icon name="package-variant" size={16} color="white" />
                <Text style={styles.statusTagText}>
                  {orderData?.status === 'IN_TRANSIT'
                    ? 'In Transit'
                    : orderData?.status === 'PICKED_UP'
                    ? 'Picked Up'
                    : orderData?.status === 'DELIVERED'
                    ? 'Delivered'
                    : 'Order Ready'}
                </Text>
              </View>
              <Text style={styles.orderId}>{orderData?.txOrderNumber}</Text>
            </View>
            <Text style={styles.estimatedTime}>
              Estimated pickup time: {orderData?.deliverySlot?.tmStartTime}
            </Text>
          </View>

          {/* Customer Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer Details</Text>
            <View style={styles.card}>
              <View style={styles.customerInfo}>
                <View style={styles.customerIcon}>
                  <Icon name="account" size={24} color={PRIMARY_GREEN} />
                </View>
                <View style={styles.customerDetails}>
                  <Text style={styles.customerName}>
                    {orderData?.customerDTO?.nmCustomer}
                  </Text>
                  <Text style={styles.customerPhone}>
                    {orderData?.customerDTO?.txPhone}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.callButton}
                  onPress={handleCallCustomer}>
                  <Icon name="phone" size={20} color="white" />
                </TouchableOpacity>
              </View>
              <View style={styles.addressContainer}>
                <Icon name="map-marker" size={16} color="#6B7280" />
                <Text style={styles.address}>
                  {orderData?.txFormattedAddress}
                </Text>
              </View>
              {orderData?.deliveryAddress?.txLandmark && (
                <View style={styles.instructionsContainer}>
                  <Icon name="information" size={16} color="#F59E0B" />
                  <Text style={styles.instructions}>
                    {orderData?.deliveryAddress?.txLandmark}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Restaurant Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Restaurant Details</Text>
            <View style={styles.card}>
              <View style={styles.restaurantInfo}>
                <View style={styles.restaurantIcon}>
                  <Icon name="store" size={24} color={PRIMARY_GREEN} />
                </View>
                <View style={styles.restaurantDetails}>
                  <Text style={styles.restaurantName}>
                    {orderData?.storeDTO?.nmStore}
                  </Text>
                  <Text style={styles.restaurantAddress}>
                    {orderData?.storeDTO?.txAddress}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.callButton}
                  onPress={handleCallRestaurant}>
                  <Icon name="phone" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Order Items */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Items</Text>
            <View style={styles.card}>
              {orderData?.orderItems.map((item: any, index: number) => (
                <View key={index} style={styles.orderItem}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.txProductName}</Text>
                    <Text style={styles.itemQuantity}>
                      Qty: {item.nbQuantity}
                    </Text>
                  </View>
                  <Text style={styles.itemPrice}>₹{item.nbPrice}</Text>
                </View>
              ))}
              <View style={styles.orderTotal}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Subtotal</Text>
                  <Text style={styles.totalValue}>
                    ₹{orderData?.nbTotalAmount}
                  </Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Delivery Fee</Text>
                  <Text style={styles.totalValue}>
                    ₹{orderData?.nbDeliveryCharge}
                  </Text>
                </View>
                <View style={[styles.totalRow, styles.finalTotal]}>
                  <Text style={styles.finalTotalLabel}>Total</Text>
                  <Text style={styles.finalTotalValue}>
                    ₹{(orderData?.nbTotalAmount || 0) + (orderData?.nbDeliveryCharge || 0)}
                  </Text>
                </View> 
              </View>
            </View>
          </View>

          {/* Earnings */}
          <View style={styles.section}>
            <View style={styles.earningsCard}>
              <View style={styles.earningsHeader}>
                <Icon name="currency-inr" size={24} color={PRIMARY_GREEN} />
                <Text style={styles.earningsTitle}>Your Earnings</Text>
              </View>
              <Text style={styles.earningsAmount}>
                ₹{orderData?.nbDeliveryCharge}
              </Text>
              <Text style={styles.earningsNote}>Estimated delivery fee</Text>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Swipe Button */}
        <View style={styles.bottomContainer}>
          <View style={styles.swipeContainer}>
            <Animated.View style={[styles.swipeTrack, swipeTrackStyle]}>
              <Animated.Text style={[styles.swipeText, swipeTextStyle]}>
                Picked Up Order
              </Animated.Text>
              <PanGestureHandler
                onGestureEvent={panHandler}
                activeOffsetX={[-10, 10]}
                activeOffsetY={[-5, 5]}
                shouldCancelWhenOutside={false}>
                <Animated.View style={[styles.swipeThumb, swipeIconStyle]}>
                  <Icon name="arrow-right" size={22} color={PRIMARY_GREEN} />
                </Animated.View>
              </PanGestureHandler>
            </Animated.View>
          </View>
        </View>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  gestureContainer: {flex: 1},
  container: {flex: 1, backgroundColor: '#f8fafc'},
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
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY_GREEN,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  statusTagText: {
    color: 'white',
    fontSize: 12,
    fontFamily: Fonts.SemiBold,
  },
  orderId: {
    fontSize: 14,
    fontFamily: Fonts.Medium,
    color: '#6B7280',
  },
  estimatedTime: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: Fonts.Medium,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: Fonts.SemiBold,
    color: '#111827',
    marginBottom: 8,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontFamily: Fonts.SemiBold,
    color: '#111827',
  },
  customerPhone: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: PRIMARY_GREEN,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  address: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    lineHeight: 20,
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  instructions: {
    flex: 1,
    fontSize: 14,
    color: '#92400e',
    marginLeft: 8,
    lineHeight: 20,
  },
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restaurantIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  restaurantDetails: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 16,
    fontFamily: Fonts.SemiBold,
    color: '#111827',
  },
  restaurantAddress: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontFamily: Fonts.Medium,
    color: '#111827',
  },
  itemQuantity: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontFamily: Fonts.SemiBold,
    color: '#111827',
  },
  orderTotal: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  totalValue: {
    fontSize: 14,
    fontFamily: Fonts.Medium,
    color: '#111827',
  },
  finalTotal: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  finalTotalLabel: {
    fontSize: 16,
    fontFamily: Fonts.SemiBold,
    color: '#111827',
  },
  finalTotalValue: {
    fontSize: 16,
    fontFamily: Fonts.Bold,
    color: '#111827',
  },
  earningsCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  earningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  earningsTitle: {
    fontSize: 16,
    fontFamily: Fonts.SemiBold,
    color: '#111827',
    marginLeft: 8,
  },
  earningsAmount: {
    fontSize: 32,
    fontFamily: Fonts.Bold,
    color: PRIMARY_GREEN,
    marginBottom: 4,
  },
  earningsNote: {
    fontSize: 12,
    color: '#6B7280',
  },
  bottomContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  swipeContainer: {
    marginBottom: Platform.OS === 'ios' ? 8 : 16,
  },
  swipeTrack: {
    height: 56,
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 28,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  swipeText: {
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontFamily: Fonts.Medium,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontFamily: Fonts.Medium,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: Fonts.SemiBold,
  },
});

export default OrderDetailsScreen;
