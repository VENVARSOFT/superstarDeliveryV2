import {StyleSheet, Text, View, Alert} from 'react-native';
import React, {FC} from 'react';
import {appAxios} from '@service/apiInterceptors';
import {resetAndNavigate} from '@utils/NavigationUtils';

interface RideItem {
  _id: string;
  vehicle?: 'bike';
  pickup: {address: string; latitude: number; longitude: number};
  drop?: {address: string; latitude: number; longitude: number};
  fare?: number;
  distance?: number;
  duration?: number;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

const RiderRideItem: FC<{item: RideItem; removeIt: () => void}> = ({
  item,
  removeIt,
}) => {
  const location = {
    latitude: item.pickup.latitude,
    longitude: item.pickup.longitude,
  };
  const acceptRide = async () => {
    try {
      const res = await appAxios.patch(`/ride/accept/${item._id}`);
      resetAndNavigate({
        pathname: 'RideTrackingScreen',
        params: {rideId: item._id},
      });
    } catch (error: any) {
      Alert.alert('Oh! Dang there was an error');
      console.log(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.rideNumber}>Ride #{item._id.slice(-6)}</Text>
    </View>
  );
};

export default RiderRideItem;

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
  },
  rideNumber: {
    fontSize: 14,
    fontWeight: '500',
  },
});
