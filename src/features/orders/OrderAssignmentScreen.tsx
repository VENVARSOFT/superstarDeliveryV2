import React, {useCallback, useEffect, useRef, useState, FC} from 'react';
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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Fonts} from '@utils/Constants';
import {
  subscribeOrderAssignment,
  respondAssignmentViaWebSocket,
} from '@service/socketService';
import {useAuthStore} from '@state/authStore';
import {navigate} from '@utils/NavigationUtils';

type Props = {
  route?: {
    params?: {
      orderId?: string;
      deliveryAgentId?: string;
    };
  };
  navigation?: any;
};

const {width, height} = Dimensions.get('window');
const PRIMARY_GREEN = '#00A86B';

const OrderAssignmentScreen: FC<Props> = ({route, navigation}) => {
  const {user} = useAuthStore();
  const [status, setStatus] = useState('Waiting for assignment...');
  const [showOrderUI, setShowOrderUI] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [hasResponded, setHasResponded] = useState(false);

  const orderId = route?.params?.orderId;
  const deliveryAgentId =
    route?.params?.deliveryAgentId || (user as any)?.idUser?.toString() || '';

  const slideAnim = useRef(new RNAnimated.Value(0)).current;
  const fadeAnim = useRef(new RNAnimated.Value(0)).current;
  const scaleAnim = useRef(new RNAnimated.Value(0.95)).current;

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
        // Navigate back after animation completes
        setTimeout(() => {
          navigation?.goBack?.();
        }, 100);
      });
    }, 100);
  }, [slideAnim, fadeAnim, scaleAnim, isAnimating, navigation]);

  // Subscribe to WebSocket for order assignment
  useEffect(() => {
    if (!orderId) {
      Alert.alert('Error', 'Order ID is required');
      return;
    }

    console.log('Subscribing to order assignment for orderId:', orderId);

    const unsubscribe = subscribeOrderAssignment(orderId, data => {
      console.log('Received order assignment data:', data);

      if (data && data.requested) {
        setOrderData(data);
        setStatus('New Delivery Request Received 🚚');
        // Trigger slide-up animation
        setTimeout(() => {
          slideUpOrderUI();
        }, 500);
      }
    });

    return () => {
      console.log('Unsubscribing from order assignment');
      unsubscribe();
    };
  }, [orderId, slideUpOrderUI]);

  const handleResponse = useCallback(
    async (response: 'YES' | 'NO') => {
      if (hasResponded) {
        return;
      }

      if (!orderId || !deliveryAgentId) {
        Alert.alert('Error', 'Missing order ID or delivery agent ID');
        return;
      }

      try {
        setHasResponded(true);
        // Use WebSocket to respond to order assignment
        const result = await respondAssignmentViaWebSocket(
          orderId,
          deliveryAgentId,
          response,
        );

        if (result) {
          setStatus(response === 'YES' ? 'Accepted ✅' : 'Rejected ❌');

          // Success animation
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

          // Slide down after delay
          setTimeout(() => {
            slideDownOrderUI();
          }, 800);

          if (response === 'YES') {
            // Navigate to pickup navigation after acceptance
            setTimeout(() => {
              navigate('PickupNavigation', {
                pickupLocation: orderData?.pickupLocation || {
                  latitude: 17.43869444638263,
                  longitude: 78.39538337328888,
                  name: 'Store Location',
                  address: 'Pickup Address',
                  phoneNumber: '+91-9876543210',
                },
                driverLocation: orderData?.driverLocation || {
                  latitude: 17.442,
                  longitude: 78.391,
                },
                orderId: orderId,
              });
            }, 1500);
          }
        } else {
          setHasResponded(false);
          Alert.alert('Error', 'Failed to send response. Please try again.');
        }
      } catch (error) {
        setHasResponded(false);
        console.error('Error responding to assignment:', error);
        Alert.alert('Error', 'Failed to send response. Please try again.');
      }
    },
    [
      orderId,
      deliveryAgentId,
      hasResponded,
      slideDownOrderUI,
      orderData,
      scaleAnim,
      fadeAnim,
    ],
  );

  useEffect(() => {
    // Cleanup animations on unmount
    return () => {
      slideAnim.stopAnimation();
      fadeAnim.stopAnimation();
      scaleAnim.stopAnimation();
    };
  }, [slideAnim, fadeAnim, scaleAnim]);

  const handleDeny = useCallback(() => {
    if (isAnimating || hasResponded) return;
    slideDownOrderUI();
  }, [isAnimating, hasResponded, slideDownOrderUI]);

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {/* Background overlay when order UI is shown */}
        {showOrderUI && (
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={handleDeny}
          />
        )}

        {/* Status indicator */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>Order Assignment</Text>
          <Text style={styles.orderIdText}>Order ID: {orderId || 'N/A'}</Text>
          <Text style={styles.statusLabel}>Status: {status}</Text>
        </View>

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
                <Text style={styles.newOrderText}>New Assignment</Text>
              </View>

              <Text style={styles.earningsLabel}>Delivery Request</Text>
              <Text style={styles.amount}>
                {orderData?.estimatedEarnings
                  ? `₹${orderData.estimatedEarnings}`
                  : 'Check Details'}
              </Text>

              {orderData?.pickupLocation && (
                <View style={styles.card}>
                  <View style={styles.pickupTag}>
                    <Text style={styles.pickupTagText}>Pick up</Text>
                  </View>
                  <Text style={styles.restaurant}>
                    {orderData.pickupLocation.name || 'Store Location'}
                  </Text>
                  <Text style={styles.address}>
                    {orderData.pickupLocation.address ||
                      orderData.pickupLocation?.formattedAddress ||
                      'Pickup Address'}
                  </Text>
                  <View style={styles.row}>
                    <Icon name="clock-outline" size={18} color="#6B7280" />
                    <Text style={styles.away}>
                      {' '}
                      {orderData.distance || 'Distance'} away
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.acceptButton]}
                  onPress={() => handleResponse('YES')}
                  disabled={hasResponded || isAnimating}
                  activeOpacity={0.8}>
                  <Icon name="check" size={24} color="white" />
                  <Text style={styles.acceptButtonText}>Accept ✅</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => handleResponse('NO')}
                  disabled={hasResponded || isAnimating}
                  activeOpacity={0.8}>
                  <Icon name="close" size={24} color="white" />
                  <Text style={styles.rejectButtonText}>Reject ❌</Text>
                </TouchableOpacity>
              </View>
            </View>
          </RNAnimated.View>
        )}

        {/* Deny button */}
        {!showOrderUI && (
          <TouchableOpacity
            style={styles.denyBtn}
            onPress={handleDeny}
            activeOpacity={0.8}>
            <Text style={styles.denyText}>× Close</Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 5,
  },
  statusContainer: {
    padding: 20,
    paddingTop: Platform.select({ios: 54, android: 24}),
    alignItems: 'center',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statusText: {
    fontSize: 20,
    fontFamily: Fonts.Bold,
    color: '#111827',
    marginBottom: 8,
  },
  orderIdText: {
    fontSize: 14,
    fontFamily: Fonts.Medium,
    color: '#6B7280',
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: 16,
    fontFamily: Fonts.Regular,
    color: '#6B7280',
    marginTop: 4,
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
  denyText: {
    color: 'white',
    fontFamily: Fonts.Medium,
  },
  orderUIContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.55,
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
  newOrderText: {
    color: PRIMARY_GREEN,
    fontFamily: Fonts.SemiBold,
  },
  earningsLabel: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 8,
  },
  amount: {
    textAlign: 'center',
    fontSize: 34,
    fontFamily: Fonts.Bold,
    color: '#111827',
  },
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
  pickupTagText: {
    color: 'white',
    fontFamily: Fonts.Medium,
    fontSize: 12,
  },
  restaurant: {
    marginTop: 10,
    fontFamily: Fonts.SemiBold,
    fontSize: 16,
    color: '#111827',
  },
  address: {
    marginTop: 4,
    color: '#4B5563',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  away: {
    color: '#6B7280',
  },
  buttonContainer: {
    marginTop: 24,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  acceptButton: {
    backgroundColor: PRIMARY_GREEN,
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  acceptButtonText: {
    color: 'white',
    fontFamily: Fonts.SemiBold,
    fontSize: 16,
  },
  rejectButtonText: {
    color: 'white',
    fontFamily: Fonts.SemiBold,
    fontSize: 16,
  },
});

export default OrderAssignmentScreen;
