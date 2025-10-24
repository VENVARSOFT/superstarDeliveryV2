import React, {useCallback, useState, useMemo} from 'react';
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
import {Fonts} from '@utils/Constants';

type Props = {
  route?: any;
  navigation?: any;
};

const {width} = Dimensions.get('window');
const PRIMARY_GREEN = '#00A86B';
const SWIPE_THRESHOLD = width * 0.7; // 70%

const OrderDetailsScreen: React.FC<Props> = ({navigation, route}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  // Swipe to confirm values
  const translateX = useSharedValue(0);

  // Get order details from route params
  const orderDetails = useMemo(
    () =>
      route?.params?.orderDetails || {
        orderId: 'ORDER_123456',
        customerName: 'John Doe',
        customerPhone: '+91-9876543210',
        customerAddress: '123 Main Street, Hyderabad, Telangana 500001',
        restaurantName: 'SuperStart Golisoda Madhapur',
        restaurantAddress: 'Plot 59, Guttala Begumpet, Madhapur, Hyderabad',
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
    [route?.params?.orderDetails],
  );

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

  const onPickedUp = useCallback(async () => {
    console.log('Order picked up confirmed');
    if (isAnimating) return;
    setIsAnimating(true);

    // Enhanced success haptic feedback
    triggerHaptic('success');
    Vibration.vibrate([0, 50, 100, 50, 100]);

    // Simulate API call
    setTimeout(() => {
      // Navigate to drop order screen
      navigation?.navigate('DropOrder', {
        orderDetails: orderDetails,
      });
      setIsAnimating(false);
    }, 800);
  }, [navigation, orderDetails, isAnimating, triggerHaptic]);

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
    console.log('Calling customer:', orderDetails.customerPhone);
  }, [orderDetails.customerPhone]);

  const handleCallRestaurant = useCallback(() => {
    // Implement call restaurant functionality
    console.log('Calling restaurant');
  }, []);

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
                <Text style={styles.statusTagText}>Order Ready</Text>
              </View>
              <Text style={styles.orderId}>#{orderDetails.orderId}</Text>
            </View>
            <Text style={styles.estimatedTime}>
              Estimated pickup time: {orderDetails.estimatedTime}
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
                    {orderDetails.customerName}
                  </Text>
                  <Text style={styles.customerPhone}>
                    {orderDetails.customerPhone}
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
                  {orderDetails.customerAddress}
                </Text>
              </View>
              {orderDetails.specialInstructions && (
                <View style={styles.instructionsContainer}>
                  <Icon name="information" size={16} color="#F59E0B" />
                  <Text style={styles.instructions}>
                    {orderDetails.specialInstructions}
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
                    {orderDetails.restaurantName}
                  </Text>
                  <Text style={styles.restaurantAddress}>
                    {orderDetails.restaurantAddress}
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
              {orderDetails.items.map((item: any, index: number) => (
                <View key={index} style={styles.orderItem}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemQuantity}>
                      Qty: {item.quantity}
                    </Text>
                  </View>
                  <Text style={styles.itemPrice}>₹{item.price}</Text>
                </View>
              ))}
              <View style={styles.orderTotal}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Subtotal</Text>
                  <Text style={styles.totalValue}>
                    ₹{orderDetails.totalAmount}
                  </Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Delivery Fee</Text>
                  <Text style={styles.totalValue}>
                    ₹{orderDetails.deliveryFee}
                  </Text>
                </View>
                <View style={[styles.totalRow, styles.finalTotal]}>
                  <Text style={styles.finalTotalLabel}>Total</Text>
                  <Text style={styles.finalTotalValue}>
                    ₹{orderDetails.totalAmount + orderDetails.deliveryFee}
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
                ₹{orderDetails.estimatedEarnings}
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
});

export default OrderDetailsScreen;
