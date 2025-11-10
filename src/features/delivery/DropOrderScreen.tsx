import React, {useCallback, useState, useEffect, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
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

const {width, height} = Dimensions.get('window');
const PRIMARY_GREEN = '#00A86B';
const BLUE_COLOR = '#2563eb';

const DropOrderScreen: React.FC<Props> = ({navigation, route}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<
    OrderDetailsResponse['data'] | null
  >(null);

  // Get user from Redux
  const user = useSelector((state: RootState) => state.auth.user);

  // Socket service
  const socketService = useWS();

  // Get orderId from route params
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

  // Initialize socket connection
  useEffect(() => {
    const unsubscribe = socketService.onConnectionChange(connected => {
      console.log(
        'Socket connection status:',
        connected ? '🟢 Connected' : '🔴 Disconnected',
      );
    });

    const connectSocket = async () => {
      if (!socketService.getConnectionStatus() && user?.idUser) {
        try {
          const storeId =
            orderData?.fkIdStoreDelivery || orderData?.storeDTO?.idStore;

          if (storeId) {
            await socketService.connect(undefined, {
              userId: user.idUser as number,
              userType: USER_TYPES.DELIVERY_PARTNER,
              storeId: storeId as number,
            });
            console.log('✅ Socket connected for drop order');
          }
        } catch (error) {
          console.error('❌ Failed to connect socket:', error);
        }
      }
    };

    if (orderData) {
      connectSocket();
    }

    return () => {
      unsubscribe();
    };
  }, [
    user?.idUser,
    orderData?.fkIdStoreDelivery,
    orderData?.storeDTO?.idStore,
    socketService,
  ]);

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
    const customerAddress =
      addressParts.join(', ') || orderData.txFormattedAddress || 'N/A';

    // Transform order items
    const items = orderData.orderItems.map(item => ({
      name: item.txProductName,
      quantity: item.nbQuantity,
      price: item.nbPrice,
    }));

    return {
      orderId: orderData.txOrderNumber || `#${orderData.idOrder}`,
      customerName,
      customerPhone,
      customerAddress,
      items,
      totalAmount: orderData.nbTotalAmount,
      deliveryFee: orderData.nbDeliveryCharge,
    };
  }, [orderData]);

  // Get current location
  const getCurrentLocation = useCallback((): Promise<{
    latitude: number;
    longitude: number;
  }> => {
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
      orderStatus:
        | 'ASSIGNED'
        | 'IN_TRANSIT'
        | 'REACHED'
        | 'PICKED'
        | 'DELIVERED' = 'IN_TRANSIT',
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
        orderId:
          typeof currentOrderId === 'string'
            ? parseInt(currentOrderId, 10)
            : currentOrderId,
        deliveryAgentId: user.idUser as number,
        latitude: latitude,
        longitude: longitude,
        timestamp: now,
        orderStatus: orderStatus,
        accuracy: accuracy || 0,
        speed: speed || 0,
      };

      console.log(
        `📤 Attempting to emit location_update with status ${orderStatus}:`,
        locationData,
      );

      try {
        const success = socketService.emit('location_update', locationData);

        if (success) {
          console.log(
            `✅ Location update sent successfully with status: ${orderStatus}`,
          );
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

  const handleBack = useCallback(() => {
    navigation?.goBack();
  }, [navigation]);

  const handleOrderDelivered = useCallback(async () => {
    if (!orderData) {
      Alert.alert('Error', 'Order data not available');
      return;
    }

    // Get current location to send with DELIVERED status
    try {
      const currentLocation = await getCurrentLocation();

      // Send location update with DELIVERED status
      sendLocationUpdate(
        currentLocation,
        {
          coords: {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          },
        },
        'DELIVERED',
      );

      console.log('✅ DELIVERED status sent with current coordinates');

      Alert.alert('Order Delivered', 'Order has been successfully delivered.', [
        {
          text: 'OK',
          onPress: () => {
            // Navigate back to dashboard or next order
            navigation?.navigate('Home');
          },
        },
      ]);
    } catch (error) {
      console.error(
        '❌ Error getting current location for DELIVERED status:',
        error,
      );
      // If we can't get location, still try to send with order coordinates
      if (orderData?.txLatitude && orderData?.txLongitude) {
        sendLocationUpdate(
          {
            latitude: parseFloat(orderData.txLatitude),
            longitude: parseFloat(orderData.txLongitude),
          },
          null,
          'DELIVERED',
        );
      }
      Alert.alert('Order Delivered', 'Order has been successfully delivered.', [
        {
          text: 'OK',
          onPress: () => {
            navigation?.navigate('DeliveryDashboard');
          },
        },
      ]);
    }
  }, [orderData, getCurrentLocation, sendLocationUpdate, navigation]);

  const handleCallCustomer = useCallback(() => {
    // Implement call customer functionality
    if (orderDetails?.customerPhone) {
      console.log('Calling customer:', orderDetails.customerPhone);
      // You can use Linking.openURL(`tel:${orderDetails.customerPhone}`) here
    }
  }, [orderDetails?.customerPhone]);

  const handleCallSupport = useCallback(() => {
    // Implement call support functionality
    console.log('Calling support');
  }, []);

  const handleProfile = useCallback(() => {
    // Navigate to profile
    navigation?.navigate('Profile');
  }, [navigation]);

  // Show loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
            <Icon name="chevron-down" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Drop order</Text>
          <View style={styles.headerActions} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_GREEN} />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </View>
    );
  }

  // Show error state
  if (error || !orderDetails) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
            <Icon name="chevron-down" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Drop order</Text>
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
                      setError(
                        response?.error || 'Failed to fetch order details',
                      );
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
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <Icon name="chevron-down" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Drop order</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleCallSupport}>
            <Icon name="alert-circle" size={20} color="#ef4444" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleCallCustomer}>
            <Icon name="phone" size={20} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleProfile}>
            <Icon name="account-circle" size={20} color="#374151" />
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
              <Text style={styles.statusTagText}>Ready to Deliver</Text>
            </View>
            <Text style={styles.orderId}>{orderDetails.orderId}</Text>
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
                  <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
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
                  ₹
                  {(orderDetails.totalAmount || 0) +
                    (orderDetails.deliveryFee || 0)}
                </Text>
              </View>
            </View>
          </View>
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
              <Text style={styles.address}>{orderDetails.customerAddress}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.deliverButton}
          onPress={handleOrderDelivered}>
          <Icon name="check-circle" size={20} color={PRIMARY_GREEN} />
          <Text style={styles.deliverButtonText}>Order Delivered</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    marginTop: 8,
  },
  address: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    lineHeight: 20,
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
  bottomContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  deliverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_GREEN,
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  deliverButtonText: {
    fontSize: 16,
    fontFamily: Fonts.SemiBold,
    color: 'white',
  },
});

export default DropOrderScreen;
