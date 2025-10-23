import React, {FC, useEffect, useRef, useState} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  SafeAreaView,
  TextInput,
} from 'react-native';
import MapView, {Region, PROVIDER_GOOGLE} from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {RFValue} from 'react-native-responsive-fontsize';
import CustomText from '@components/ui/CustomText';
import {Colors, Fonts} from '@utils/Constants';
import {} from '@utils/Scaling';
import {goBack} from '@utils/NavigationUtils';
import Geolocation from '@react-native-community/geolocation';
import {getAddressFromCoords} from '@service/mapService';
import {useAuthStore} from '@state/authStore';
import {updateUserLocation} from '@service/authService';
import {GOOGLE_MAP_API} from '@service/config';
import PlacesAutocompleteResults, {
  PlacePrediction,
} from '@components/ui/PlacesAutocompleteResults';

const DEFAULT_DELTA = {latitudeDelta: 0.005, longitudeDelta: 0.005};

const ConfirmLocation: FC = () => {
  const mapRef = useRef<MapView | null>(null);
  const geocodeTimer = useRef<any>(null);
  const searchTimer = useRef<any>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [address, setAddress] = useState<string>('Fetching address...');
  const [title, setTitle] = useState<string>('');
  const {setUser, user} = useAuthStore();
  const [mapReady, setMapReady] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [placesData, setPlacesData] = useState<any>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showPlaces, setShowPlaces] = useState<boolean>(false);

  useEffect(() => {
    // Seed initial region/address from redux user if available
    if (!mapReady && user?.liveLocation) {
      const next = {
        latitude: user.liveLocation.latitude,
        longitude: user.liveLocation.longitude,
        ...DEFAULT_DELTA,
      } as Region;
      setRegion(next);
      if (user.address) {
        setAddress(user.address);
        const first = user.address.split(',')[0] || '';
        setTitle(first);
      }
    }

    if (Platform.OS === 'ios') {
      try {
        // @ts-ignore setRNConfiguration is available on iOS
        Geolocation.setRNConfiguration?.({
          skipPermissionRequests: false,
          authorizationLevel: 'whenInUse',
        });
      } catch {}
      // New API: no arguments. iOS reads authorization level from configuration/plist
      Geolocation.requestAuthorization();
    } else {
      Geolocation.requestAuthorization();
    }

    Geolocation.getCurrentPosition(
      position => {
        const {latitude, longitude} = position.coords;
        const next = {
          latitude,
          longitude,
          ...DEFAULT_DELTA,
        } as Region;
        setRegion(next);
        if (mapRef.current && mapReady) {
          mapRef.current.animateToRegion(next, 500);
        }
        fetchAddress(latitude, longitude);
      },
      () => {},
      {enableHighAccuracy: true, timeout: 10000},
    );
  }, [mapReady]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (geocodeTimer.current) {
        clearTimeout(geocodeTimer.current);
      }
      if (searchTimer.current) {
        clearTimeout(searchTimer.current);
      }
    };
  }, []);

  const onCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      position => {
        const {latitude, longitude} = position.coords;
        const next = {
          latitude,
          longitude,
          ...DEFAULT_DELTA,
        } as Region;
        setRegion(next);
        if (mapRef.current && mapReady) {
          mapRef.current.animateToRegion(next, 500);
        }
        fetchAddress(latitude, longitude);
      },
      () => {
        if (region && mapRef.current && mapReady) {
          mapRef.current.animateToRegion(region, 500);
        }
      },
      {enableHighAccuracy: true, timeout: 10000},
    );
  };

  const fetchAddress = async (latitude: number, longitude: number) => {
    const addr = await getAddressFromCoords(latitude, longitude);
    if (addr) {
      setAddress(addr);
      const first = addr.split(',')[0] || '';
      setTitle(first);
    } else {
      setAddress('Address not found for this location');
      setTitle('Current location');
    }
  };

  const handleSearchPlaces = (query: string) => {
    setSearchQuery(query);

    // Clear existing timer
    if (searchTimer.current) {
      clearTimeout(searchTimer.current);
    }

    if (query.length < 2) {
      setPlacesData(null);
      setShowPlaces(false);
      return;
    }

    // Debounce the search
    searchTimer.current = setTimeout(async () => {
      setIsSearching(true);
      setShowPlaces(true);

      try {
        console.log('Starting places search for:', query);
        console.log('API Key:', GOOGLE_MAP_API ? 'Present' : 'Missing');

        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          query,
        )}&key=${GOOGLE_MAP_API}&components=country:in`;

        console.log('Request URL:', url);

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Places API response:', data);
        setPlacesData(data);
      } catch (error: any) {
        console.error('Error searching places:', error);
        console.error('Error details:', {
          message: (error as any)?.message,
          name: (error as any)?.name,
          stack: (error as any)?.stack,
        });
        setPlacesData(null);
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce
  };

  const handlePlaceSelectFromResults = async (place: PlacePrediction) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&key=${GOOGLE_MAP_API}&fields=formatted_address,geometry,name`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (
        data.result &&
        data.result.geometry &&
        data.result.geometry.location
      ) {
        const newRegion = {
          latitude: data.result.geometry.location.lat,
          longitude: data.result.geometry.location.lng,
          ...DEFAULT_DELTA,
        } as Region;

        setRegion(newRegion);
        setAddress(data.result.formatted_address || place.description);
        setTitle(place.structured_formatting?.main_text || 'Selected location');
        setShowPlaces(false);
        setSearchQuery('');

        if (mapRef.current && mapReady) {
          mapRef.current.animateToRegion(newRegion, 1000);
        }
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
    }
  };

  const onMapChanged = (r: Region) => {
    // Debug: region change
    console.log('Map region changed', r.latitude, r.longitude);
    setRegion(r);
    if (geocodeTimer.current) {
      clearTimeout(geocodeTimer.current);
    }
    geocodeTimer.current = setTimeout(() => {
      console.log('Fetching address for', r.latitude, r.longitude);
      fetchAddress(r.latitude, r.longitude);
    }, 400);
  };

  const onConfirm = () => {
    if (!region) return;

    setUser({
      ...(user || {}),
      address,
      liveLocation: {latitude: region.latitude, longitude: region.longitude},
    } as any);

    updateUserLocation(
      {
        liveLocation: {latitude: region.latitude, longitude: region.longitude},
        address,
      },
      setUser,
    );
    goBack();
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
          <Icon name="chevron-left" size={RFValue(24)} color={Colors.text} />
        </TouchableOpacity>
        <CustomText
          fontFamily={Fonts.SemiBold}
          variant="h7"
          style={styles.headerTitle}>
          Confirm map pin location
        </CustomText>
        <View style={{width: RFValue(24)}} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon name="magnify" size={RFValue(18)} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for area, street name..."
            placeholderTextColor="#8e8e93"
            value={searchQuery}
            onChangeText={handleSearchPlaces}
            returnKeyType="search"
            autoFocus={false}
          />
        </View>

        {/* Places Results */}
        {showPlaces && (
          <PlacesAutocompleteResults
            data={placesData}
            isLoading={isSearching}
            onPlaceSelect={handlePlaceSelectFromResults}
            onClose={() => setShowPlaces(false)}
            maxHeight={200}
          />
        )}
      </View>

      {/* Map */}
      <View style={{flex: 1}}>
        <MapView
          ref={ref => {
            mapRef.current = ref;
          }}
          style={{flex: 1}}
          onMapReady={() => setMapReady(true)}
          showsUserLocation
          showsMyLocationButton={false}
          // ✅ FIXED: Force Google Maps provider on both iOS & Android
          provider={PROVIDER_GOOGLE}
          initialRegion={
            region || {
              latitude: 28.6139,
              longitude: 77.209,
              ...DEFAULT_DELTA,
            }
          }
          onRegionChangeComplete={onMapChanged}
        />

        {/* Pin marker overlay */}
        <View pointerEvents="none" style={styles.centerPinWrapper}>
          <View style={styles.pinShadow} />
          <Image
            source={require('@assets/icons/my_pin.png')}
            style={styles.centerPin}
            resizeMode="contain"
          />
          <View style={styles.tooltip}>
            <CustomText
              fontFamily={Fonts.Medium}
              variant="h9"
              style={{color: '#fff'}}>
              Move the pin to adjust your location
            </CustomText>
          </View>
        </View>

        {/* Current location button */}
        <View style={styles.currentLocationCtaWrapper}>
          <TouchableOpacity
            style={styles.currentLocationCta}
            onPress={onCurrentLocation}>
            <Icon
              name="crosshairs-gps"
              color={Colors.primary}
              size={RFValue(16)}
            />
            <CustomText
              fontFamily={Fonts.SemiBold}
              variant="h9"
              style={styles.currentLocationText}>
              Go to current location
            </CustomText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom card */}
      <View style={styles.card}>
        <View style={styles.deliveryRow}>
          <View style={styles.addressIcon}>
            <Icon name="map-marker" color={Colors.primary} size={RFValue(16)} />
          </View>
          <View style={{flex: 1}}>
            <CustomText fontFamily={Fonts.SemiBold} variant="h8">
              {title || 'Current location'}
            </CustomText>
            <CustomText
              fontFamily={Fonts.Regular}
              variant="h9"
              style={{color: '#666'}}
              numberOfLines={2}>
              {address}
            </CustomText>
          </View>
          <TouchableOpacity>
            <CustomText
              fontFamily={Fonts.SemiBold}
              variant="h8"
              style={{color: Colors.primary}}>
              Change
            </CustomText>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm}>
          <CustomText
            fontFamily={Fonts.SemiBold}
            variant="h4"
            style={{color: '#fff'}}>
            Confirm location
          </CustomText>
          <Icon name="chevron-right" size={RFValue(18)} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={{alignSelf: 'center', paddingVertical: RFValue(10)}}>
          <CustomText
            fontFamily={Fonts.SemiBold}
            variant="h8"
            style={{color: Colors.primary}}>
            Request address from someone else
          </CustomText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: RFValue(12),
    paddingTop: Platform.OS === 'android' ? RFValue(8) : 0,
    paddingBottom: RFValue(8),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  backBtn: {
    width: RFValue(32),
    height: RFValue(32),
    borderRadius: RFValue(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: Colors.text,
  },
  searchContainer: {
    marginHorizontal: RFValue(12),
    marginBottom: RFValue(8),
    zIndex: 1000,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RFValue(12),
    backgroundColor: '#fff',
    paddingHorizontal: RFValue(12),
    paddingVertical: RFValue(10),
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 6,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: RFValue(8),
    fontFamily: Fonts.Regular,
    color: Colors.text,
    padding: 0,
    fontSize: RFValue(14),
  },
  googlePlacesInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RFValue(12),
    backgroundColor: '#fff',
    paddingHorizontal: RFValue(12),
    paddingVertical: RFValue(10),
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 6,
    elevation: 2,
  },
  googlePlacesTextInput: {
    flex: 1,
    marginLeft: RFValue(8),
    fontFamily: Fonts.Regular,
    color: Colors.text,
    padding: 0,
    fontSize: RFValue(14),
  },
  googlePlacesListView: {
    backgroundColor: '#fff',
    borderRadius: RFValue(12),
    marginTop: RFValue(4),
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: {width: 0, height: 4},
    shadowRadius: 8,
    elevation: 5,
    maxHeight: RFValue(300),
  },
  googlePlacesRow: {
    paddingHorizontal: RFValue(12),
    paddingVertical: RFValue(12),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  googlePlacesDescription: {
    fontFamily: Fonts.Regular,
    color: Colors.text,
    fontSize: RFValue(14),
  },
  googlePlacesPredefinedPlacesDescription: {
    fontFamily: Fonts.Regular,
    color: '#666',
    fontSize: RFValue(12),
  },
  centerPinWrapper: {
    position: 'absolute',
    top: '33%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  centerPin: {
    width: RFValue(42),
    height: RFValue(42),
  },
  pinShadow: {
    width: RFValue(24),
    height: RFValue(6),
    backgroundColor: 'rgba(0,0,0,0.12)',
    borderRadius: RFValue(12),
    marginBottom: RFValue(6),
  },
  tooltip: {
    marginTop: RFValue(6),
    backgroundColor: '#000',
    paddingHorizontal: RFValue(10),
    paddingVertical: RFValue(6),
    borderRadius: RFValue(8),
  },
  currentLocationCtaWrapper: {
    position: 'absolute',
    bottom: RFValue(16),
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  currentLocationCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RFValue(8),
    backgroundColor: '#fff',
    paddingHorizontal: RFValue(14),
    paddingVertical: RFValue(10),
    borderRadius: RFValue(24),
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 6,
    elevation: 3,
  },
  currentLocationText: {
    color: Colors.text,
  },
  card: {
    paddingHorizontal: RFValue(12),
    paddingTop: RFValue(12),
    paddingBottom: Platform.OS === 'ios' ? RFValue(22) : RFValue(12),
    backgroundColor: '#fff',
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RFValue(12),
    backgroundColor: '#fff',
    borderRadius: RFValue(12),
    padding: RFValue(12),
    borderWidth: 1,
    borderColor: '#e6e6e6',
  },
  addressIcon: {
    width: RFValue(28),
    height: RFValue(28),
    borderRadius: RFValue(14),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef7ef',
  },
  confirmBtn: {
    marginTop: RFValue(14),
    backgroundColor: Colors.primary,
    borderRadius: RFValue(10),
    paddingVertical: RFValue(14),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: RFValue(6),
  },
});

export default ConfirmLocation;
