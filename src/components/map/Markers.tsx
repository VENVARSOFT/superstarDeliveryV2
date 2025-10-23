import {View, Text} from 'react-native';
import React from 'react';
import {Marker} from 'react-native-maps';

const Markers = ({
  deliveryLocation,
  pickupLocation,
  deliveryPersonLocation,
}: any) => {
  return (
    <>
      {deliveryLocation && (
        <Marker
          zIndex={11}
          image={require('@assets/icons/my_pin.png')}
          coordinate={deliveryLocation}
          style={{height: 20, width: 20}}
        />
      )}

      {pickupLocation && (
        <Marker
          image={require('@assets/icons/store.png')}
          coordinate={pickupLocation}
          zIndex={22}
          style={{height: 20, width: 20}}
        />
      )}

      {deliveryPersonLocation && (
        <Marker
          image={require('@assets/icons/delivery.png')}
          coordinate={deliveryPersonLocation}
          zIndex={99}
          style={{
            position: 'absolute',
            zIndex: 99,
            height: 20,
            width: 20,
          }}
        />
      )}
    </>
  );
};

export default Markers;
