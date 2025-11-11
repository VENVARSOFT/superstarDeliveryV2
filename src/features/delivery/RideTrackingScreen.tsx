import React, {useEffect, useState, useCallback} from 'react';

import {
  View,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {useRoute, useNavigation} from '@react-navigation/native';
import MapView, {Marker, PROVIDER_GOOGLE} from 'react-native-maps';
import axios from 'axios';

import {tokenManager} from '@utils/tokenManager';
import CustomText from '@components/ui/CustomText';
import {Colors, Fonts} from '@utils/Constants';
import {RFValue} from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {SOCKET_URL} from '@service/config';

interface RideTrackingScreenParams {
  rideId: string;
  driverId?: string;
}

interface TestSocketResponse {
  message: string;
  status: boolean;
  driversCount: number;
}

interface Message {
  text: string;
  user?: {
    name: string;
  };
  timestamp?: string;
}

interface DriverLocation {
  latitude: number;
  longitude: number;
  heading?: number;
}

const RideTrackingScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const {rideId, driverId} = (route.params as RideTrackingScreenParams) || {};

  const [isConnected, setIsConnected] = useState(false);
  const [rideStatus, setRideStatus] = useState('pending');
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(
    null,
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [deliverySuccessMessage, setDeliverySuccessMessage] = useState<
    string | null
  >(null);

  // Call test socket API when delivery is successful
  const callTestSocketAPI = useCallback(async () => {
    try {
      const apiUrl = `${SOCKET_URL}/api/test/socket`;
      const params: any = {};

      if (driverId) {
        params.driverId = driverId;
      }

      const response = await axios.get<TestSocketResponse>(apiUrl, {
        params,
      });

      if (response.data && response.data.status) {
        setDeliverySuccessMessage(response.data.message);
        console.log('Test socket API success:', response.data.message);
      }
    } catch (error) {
      console.error('Error calling test socket API:', error);
      // Don't show error alert for this API call as it's not critical
    }
  }, [driverId]);

  // Handle ride status updates
  const handleRideUpdate = useCallback(
    (data: any) => {
      console.log('Ride updated:', data);
      if (data?.status) {
        const newStatus = data.status || rideStatus;
        setRideStatus(newStatus);

        if (newStatus) {
          // Call test socket API when delivery is completed
          callTestSocketAPI();
        }
      }
    },
    [rideId, rideStatus, callTestSocketAPI],
  );

  // Handle driver location updates
  const handleDriverLocation = useCallback((location: DriverLocation) => {
    console.log('Driver location updated:', location);
    setDriverLocation({
      latitude: location.latitude,
      longitude: location.longitude,
      heading: location.heading,
    });
  }, []);

  // Handle new messages
  const handleNewMessage = useCallback((message: Message) => {
    console.log('New message received:', message);
    setMessages(prevMessages => [...prevMessages, message]);
  }, []);

  // Handle errors
  const handleError = useCallback((error: any) => {
    console.error('Socket error:', error);
  }, []);

  const getStatusColor = () => {
    switch (rideStatus.toLowerCase()) {
      case 'accepted':
      case 'ongoing':
        return '#4CAF50';

      case 'completed':
        return '#2196F3';

      case 'cancelled':
        return '#F44336';

      default:
        return '#FF9800';
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <CustomText
          variant="h7"
          fontFamily={Fonts.Medium}
          style={styles.loadingText}>
          Connecting...
        </CustomText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, {paddingTop: insets.top}]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Icon name="chevron-left" size={RFValue(24)} color="#fff" />
        </TouchableOpacity>

        <CustomText
          variant="h6"
          fontFamily={Fonts.SemiBold}
          style={styles.headerTitle}>
          Track Ride
        </CustomText>

        <View style={styles.headerRight} />
      </View>

      {/* Connection Status */}
      <View style={styles.statusBar}>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              {backgroundColor: isConnected ? '#4CAF50' : '#F44336'},
            ]}
          />

          <CustomText
            variant="h8"
            fontFamily={Fonts.Medium}
            style={styles.statusText}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </CustomText>
        </View>

        <View style={styles.statusBadge}>
          <CustomText
            variant="h8"
            fontFamily={Fonts.SemiBold}
            style={[styles.rideStatusText, {color: getStatusColor()}]}>
            {rideStatus.toUpperCase()}
          </CustomText>
        </View>
      </View>

      {/* Delivery Success Message */}
      {deliverySuccessMessage && (
        <View style={styles.successMessageContainer}>
          <Icon name="check-circle" size={RFValue(20)} color="#4CAF50" />
          <CustomText
            variant="h8"
            fontFamily={Fonts.Medium}
            style={styles.successMessageText}>
            {deliverySuccessMessage}
          </CustomText>
        </View>
      )}

      {/* Map with Driver Location */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={
            driverLocation
              ? {
                  latitude: driverLocation.latitude,
                  longitude: driverLocation.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }
              : {
                  latitude: 17.385,
                  longitude: 78.4867,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }
          }>
          {driverLocation && (
            <Marker
              coordinate={{
                latitude: driverLocation.latitude,
                longitude: driverLocation.longitude,
              }}
              title="Driver"
              description="Your driver's location">
              <Icon name="car" size={RFValue(30)} color={Colors.primary} />
            </Marker>
          )}
        </MapView>
      </View>

      {/* Messages Section */}
      <View style={styles.messagesContainer}>
        <View style={styles.messagesHeader}>
          <CustomText
            variant="h7"
            fontFamily={Fonts.SemiBold}
            style={styles.messagesTitle}>
            Messages
          </CustomText>
        </View>

        <ScrollView
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}>
          {messages.length === 0 ? (
            <CustomText
              variant="h8"
              fontFamily={Fonts.Regular}
              style={styles.noMessagesText}>
              No messages yet
            </CustomText>
          ) : (
            messages.map((msg, index) => (
              <View key={index} style={styles.messageItem}>
                <CustomText
                  variant="h8"
                  fontFamily={Fonts.Regular}
                  style={styles.messageText}>
                  {msg.text}
                </CustomText>

                {msg.user?.name && (
                  <CustomText
                    variant="h9"
                    fontFamily={Fonts.Medium}
                    style={styles.messageSender}>
                    {msg.user.name}
                  </CustomText>
                )}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    color: Colors.primary,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  statusBar: {
    padding: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  rideStatusText: {
    fontSize: RFValue(12),
  },
  successMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 12,
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  successMessageText: {
    color: '#2E7D32',
    marginLeft: 8,
    flex: 1,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  messagesContainer: {
    maxHeight: 200,
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  messagesHeader: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  messagesTitle: {
    color: '#000',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 12,
  },
  noMessagesText: {
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
  messageItem: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  messageText: {
    color: '#000',
    marginBottom: 4,
  },
  messageSender: {
    color: '#666',
    fontSize: RFValue(11),
  },
});

export default RideTrackingScreen;
