import {StyleSheet, View, FlatList, Image, Alert} from 'react-native';
import React, {useEffect, useState, useRef, useCallback} from 'react';
import Geolocation from '@react-native-community/geolocation';
import {Colors} from '@utils/Constants';
import {useAuthStore} from '@state/authStore';
import {OrderAssignmentRequest, useWS} from '@service/WsProvider';
import {getAddressFromCoords} from '@service/mapService';
import {useSelector} from 'react-redux';
import type {RootState} from '@state/store';
import {navigate} from '@utils/NavigationUtils';
import RiderHeader from '../rider/RiderHeader';
import RiderRideItem from '../rider/RiderRideItem';
import CustomText from '@components/ui/CustomText';

interface LocationState {
  latitude: number;
  longitude: number;
  address: string;
  heading: number | null;
}

// Image source constant to prevent re-creation
const RIDE_IMAGE = require('@assets/icons/ride.jpg');

const Home = () => {
  const {setUser} = useAuthStore();
  //USER INFORMATION
  const user = useSelector((state: RootState) => state.auth.user);
  //WEBSOCKET
  const socketService = useWS();
  const {emit, on, off, onOrderAssignmentResponse} = useWS();

  const [rideOffers, setRideOffers] = useState<any[]>([]);
  //LOCATION
  const [_location, setLocation] = useState<LocationState | null>(null);
  const [onDuty, setOnDuty] = useState(true);
  const locationsSubscriptionRef = useRef<number | null>(null);
  const userRef = useRef(user);

  //CONNECTION STATUS
  const [isConnected, setIsConnected] = useState(false);
  //ORDER REQUEST
  const [orderRequest, setOrderRequest] =
    useState<OrderAssignmentRequest | null>(null);

  //FETCH ORDER
  useEffect(() => {
    // 1. Connect with user information
    const connectSocket = async () => {
      try {
        await socketService.connect(undefined, {
          userId: user?.idUser as number,
          userType: 'DELIVERY_AGENT',
          storeId: user?.fkStoreId as number,
        });
        console.log('Socket connected successfully!');
      } catch (error) {
        console.error('Failed to connect:', error);
        Alert.alert('Connection Error', 'Failed to connect to server');
      }
    };

    connectSocket();

    // 2. Monitor connection status
    const unsubscribe = socketService.onConnectionChange(connected => {
      setIsConnected(connected);
      console.log(
        'Connection status:',
        connected ? '🟢 Connected' : '🔴 Disconnected',
      );
    });

    // 3. Listen for order assignment requests
    socketService.onOrderAssignmentRequest(data => {
      console.log('📦 New order assignment request received:', data);
      setOrderRequest(data);

      // Navigate to AcceptOrderScreen with order data
      navigate('AcceptOrder', {
        orderData: data,
      });
    });

    // 4. Listen for order assignment responses
    socketService.onOrderAssignmentResponse(data => {
      console.log('📥 Order assignment response:', data);

      if (data.type === 'ASSIGNED') {
        Alert.alert(
          '✅ Success',
          `Order ${data.orderId} has been assigned to you!`,
        );
      } else if (data.type === 'DECLINED') {
        Alert.alert('ℹ️ Info', `Order ${data.orderId} was declined.`);
      } else if (data.type === 'ALREADY_ASSIGNED') {
        Alert.alert(
          '⚠️ Oops',
          `Order ${data.orderId} was already assigned to another agent.`,
        );
      }
    });

    // 5. Listen for order status updates
    socketService.onOrderStatusUpdate(data => {
      console.log('📊 Order status update:', data);
      // Handle status updates (e.g., order picked up, delivered, etc.)
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
      socketService.offOrderAssignmentRequest();
      socketService.disconnect();
    };
  }, []);

  // ==================== HANDLE ACCEPT ORDER ====================
  const handleAcceptOrder = (orderData: OrderAssignmentRequest) => {
    const success = socketService.sendOrderAssignmentResponse({
      orderId: orderData.orderId,
      deliveryAgentId: user?.idUser as number,
      response: 'ACCEPT',
      message: 'I will deliver this order',
    });

    if (success) {
      console.log('✅ Accept response sent successfully');
      setOrderRequest(null); // Clear current order request
    } else {
      Alert.alert(
        'Error',
        'Failed to send response. Please check your connection.',
      );
    }
  };

  // ==================== HANDLE REJECT ORDER ====================
  const handleRejectOrder = (orderData: OrderAssignmentRequest) => {
    const success = socketService.sendOrderAssignmentResponse({
      orderId: orderData.orderId,
      deliveryAgentId: user?.idUser as number,
      response: 'REJECT',
      message: 'Currently unavailable',
    });

    if (success) {
      console.log('❌ Reject response sent successfully');
      setOrderRequest(null); // Clear current order request
    } else {
      Alert.alert(
        'Error',
        'Failed to send response. Please check your connection.',
      );
    }
  };

  // Keep user ref updated
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // useEffect(() => {
  //   const startLocationUpdates = () => {
  //     // Request location permission
  //     Geolocation.requestAuthorization();

  //     // Start watching position
  //     locationsSubscriptionRef.current = Geolocation.watchPosition(
  //       async position => {
  //         const {latitude, longitude, heading} = position.coords;

  //         // Get address from coordinates
  //         let address = 'Somewhere';
  //         try {
  //           const fetchedAddress = await getAddressFromCoords(
  //             latitude,
  //             longitude,
  //           );
  //           if (fetchedAddress) {
  //             address = fetchedAddress;
  //           }
  //         } catch (error) {
  //           console.error('Error fetching address:', error);
  //         }

  //         // Update local state
  //         setLocation({
  //           latitude,
  //           longitude,
  //           address,
  //           heading: heading as number,
  //         });

  //         // Update user in store - create a clean serializable object
  //         if (userRef.current) {
  //           // Create a clean copy without any functions or non-serializable values
  //           const cleanUser = JSON.parse(JSON.stringify(userRef.current));
  //           setUser({
  //             ...cleanUser,
  //             liveLocation: {latitude, longitude},
  //             address,
  //           });
  //         }

  //         // Emit location update via WebSocket
  //         emit('updateLocation', {
  //           latitude,
  //           longitude,
  //           heading: heading as number,
  //         });
  //       },
  //       error => {
  //         console.error('Location tracking error:', error);
  //       },
  //       {
  //         enableHighAccuracy: true,
  //         distanceFilter: 10, // Update every 10 meters
  //         interval: 10000, // Update every 10 seconds
  //       },
  //     );
  //   };

  //   startLocationUpdates();

  //   // Cleanup function
  //   return () => {
  //     if (locationsSubscriptionRef.current !== null) {
  //       Geolocation.clearWatch(locationsSubscriptionRef.current);
  //       locationsSubscriptionRef.current = null;
  //     }
  //   };
  // }, [emit, setUser]);

  const renderRides = useCallback(({item}: {item: any}) => {
    return <RiderRideItem ride={item} />;
  }, []);

  const renderEmptyComponent = useCallback(() => {
    return (
      <View style={styles.emptyContainer}>
        {onDuty && (
          <Image
            source={RIDE_IMAGE}
            style={styles.emptyImage}
            resizeMode="contain"
            key="ride-empty-image"
            fadeDuration={0}
          />
        )}
        <CustomText fontSize={12} style={styles.emptyText}>
          {onDuty
            ? 'There are no available rides! Stay Active'
            : "You're currently OFF-DUTY, please go ON-DUTY to start earning"}
        </CustomText>
      </View>
    );
  }, [onDuty]);

  return (
    <View style={styles.container}>
      <RiderHeader onDuty={onDuty} setOnDuty={setOnDuty} />
      {isConnected && (
        <CustomText fontSize={12} style={styles.statusText}>
          Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </CustomText>
      )}
      <FlatList
        data={!onDuty ? [] : rideOffers}
        renderItem={renderRides}
        style={styles.flatList}
        contentContainerStyle={
          !onDuty || rideOffers.length === 0
            ? styles.flatListContentEmpty
            : styles.flatListContent
        }
        keyExtractor={(item: any) =>
          item?._id || item?.id || Math.random().toString()
        }
        ListEmptyComponent={renderEmptyComponent}
        removeClippedSubviews={false}
        maintainVisibleContentPosition={null}
      />
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  flatList: {
    flex: 1,
    backgroundColor: '#fff',
  },
  flatListContent: {
    padding: 10,
    paddingBottom: 120,
  },
  flatListContentEmpty: {
    flexGrow: 1,
    backgroundColor: '#fff',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyImage: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#363636',
    paddingHorizontal: 20,
  },
  statusText: {
    textAlign: 'center',
    color: '#363636',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
});
