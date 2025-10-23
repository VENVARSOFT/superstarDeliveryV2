import React, {memo} from 'react';
import MapView, {Polyline} from 'react-native-maps';
import {customMapStyle} from '@utils/CustomMap';
import Markers from './Markers';
import {getPoints} from '@utils/getPoints';
import {Colors} from '@utils/Constants';
import MapViewDirections from 'react-native-maps-directions';
import {GOOGLE_MAP_API} from '@service/config';
import {View, StyleSheet} from 'react-native';

const MapViewComponent = ({
  mapRef: _mapRef,
  hasAccepted,
  setMapRef,
  camera,
  deliveryLocation,
  pickupLocation,
  deliveryPersonLocation,
  hasPickedUp,
}: any) => {
  try {
    return (
      <MapView
        ref={setMapRef}
        style={styles.mapView}
        provider="google"
        camera={camera}
        customMapStyle={customMapStyle}
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
        {deliveryPersonLocation && (hasPickedUp || hasAccepted) && (
          <MapViewDirections
            origin={deliveryPersonLocation}
            destination={hasAccepted ? pickupLocation : deliveryLocation}
            precision="high"
            apikey={GOOGLE_MAP_API}
            strokeColor="#2871F2"
            strokeColors={['#2871F2']}
            strokeWidth={5}
            onError={err => {
              console.log('MapViewDirections error:', err);
            }}
          />
        )}

        <Markers
          deliveryPersonLocation={deliveryPersonLocation}
          deliveryLocation={deliveryLocation}
          pickupLocation={pickupLocation}
        />

        {!hasPickedUp && deliveryLocation && pickupLocation && (
          <Polyline
            coordinates={getPoints([pickupLocation, deliveryLocation])}
            strokeColor={Colors.text}
            strokeWidth={2}
            geodesic={true}
            lineDashPattern={[12, 10]}
          />
        )}
      </MapView>
    );
  } catch (error) {
    console.error('MapViewComponent error:', error);
    return <View style={styles.errorView} />;
  }
};

const styles = StyleSheet.create({
  mapView: {
    flex: 1,
  },
  errorView: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
});

export default memo(MapViewComponent);
