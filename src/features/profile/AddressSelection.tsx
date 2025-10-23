import React, {FC, useEffect, useRef, useState} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  SafeAreaView,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import MapView, {Region, PROVIDER_GOOGLE} from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {RFValue} from 'react-native-responsive-fontsize';
import CustomText from '@components/ui/CustomText';
import {Colors, Fonts} from '@utils/Constants';
import {goBack} from '@utils/NavigationUtils';
import Geolocation from '@react-native-community/geolocation';
import {
  getAddressFromCoords,
  getPostalCodeFromCoords,
} from '@service/mapService';
import {useAuthStore} from '@state/authStore';
import {GOOGLE_MAP_API} from '@service/config';
import PlacesAutocompleteResults, {
  PlacePrediction,
} from '@components/ui/PlacesAutocompleteResults';

const DEFAULT_DELTA = {latitudeDelta: 0.005, longitudeDelta: 0.005};

type AddressType = 'Home' | 'Work' | 'Other';

const AddressSelection: FC = () => {
  const mapRef = useRef<MapView | null>(null);
  const geocodeTimer = useRef<any>(null);
  const searchTimer = useRef<any>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [address, setAddress] = useState<string>('Fetching address...');
  const [title, setTitle] = useState<string>('');
  const {user} = useAuthStore();
  const [mapReady, setMapReady] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [placesData, setPlacesData] = useState<any>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showPlaces, setShowPlaces] = useState<boolean>(false);

  // Form fields
  const [addressDetails, setAddressDetails] = useState<string>('');
  const [selectedAddressType, setSelectedAddressType] =
    useState<AddressType>('Home');

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
  }, [mapReady, user]);

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

    if (searchTimer.current) {
      clearTimeout(searchTimer.current);
    }

    if (query.length < 2) {
      setPlacesData(null);
      setShowPlaces(false);
      return;
    }

    searchTimer.current = setTimeout(async () => {
      setIsSearching(true);
      setShowPlaces(true);

      try {
        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          query,
        )}&key=${GOOGLE_MAP_API}&components=country:in`;

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setPlacesData(data);
      } catch (error: any) {
        console.error('Error searching places:', error);
        setPlacesData(null);
      } finally {
        setIsSearching(false);
      }
    }, 300);
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
    setRegion(r);
    if (geocodeTimer.current) {
      clearTimeout(geocodeTimer.current);
    }
    geocodeTimer.current = setTimeout(() => {
      fetchAddress(r.latitude, r.longitude);
    }, 400);
  };

  const onSaveAddress = () => {
    if (!region) return;

    saveAddress();
  };

  const saveAddress = async () => {
    if (!region) return;
    try {
      const postalCode = await getPostalCodeFromCoords(
        region.latitude,
        region.longitude,
      );

      const payload = {
        idUser: user?.idUser as number,
        idTenant: 1,
        txAddressLine1: null,
        txAddressLine2: null,
        txCity: null,
        txState: null,
        txPostalCode: postalCode || null,
        txCountry: null,
        txLatitude: String(region.latitude),
        txLongitude: String(region.longitude),
        txFormattedAddress: address || null,
        flFavorite: false,
        txAddressType: selectedAddressType,
        txPhone: user?.nbPhone || null,
      };

      const {createOrUpdateAddress} = await import('@service/addressService');
      const res = await createOrUpdateAddress(payload as any);
      if (res) {
        goBack();
      }
    } catch (e) {
      // no-op
    }
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}}>
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backBtn}>
            <Icon name="chevron-left" size={RFValue(24)} color={Colors.text} />
          </TouchableOpacity>
          <CustomText
            fontFamily={Fonts.SemiBold}
            variant="h7"
            style={styles.headerTitle}>
            Add Delivery Address
          </CustomText>
          <View style={{width: RFValue(24)}} />
        </View>

        <ScrollView
          style={{flex: 1}}
          contentContainerStyle={{flexGrow: 1}}
          keyboardShouldPersistTaps="handled">
          {/* Search */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Icon name="magnify" size={RFValue(18)} color="#999" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search..."
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
          <View style={styles.mapContainer}>
            <MapView
              ref={ref => {
                mapRef.current = ref;
              }}
              style={styles.map}
              onMapReady={() => setMapReady(true)}
              showsUserLocation
              showsMyLocationButton={false}
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
                  Move pin to your exact delivery location
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
                  Use current location
                </CustomText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            {/* Delivery details */}
            <View style={styles.sectionHeader}>
              <CustomText
                fontFamily={Fonts.Medium}
                variant="h8"
                style={styles.sectionTitle}>
                Delivery details
              </CustomText>
            </View>

            <View style={styles.deliveryRow}>
              <View style={styles.addressIcon}>
                <Icon
                  name="map-marker"
                  color={Colors.primary}
                  size={RFValue(16)}
                />
              </View>
              <View style={{flex: 1}}>
                <CustomText
                  fontFamily={Fonts.SemiBold}
                  variant="h8"
                  style={{fontSize: RFValue(12)}}>
                  {title || 'Current location'}
                </CustomText>
                <CustomText
                  fontFamily={Fonts.Regular}
                  variant="h9"
                  style={{color: '#666', fontSize: RFValue(10)}}
                  numberOfLines={2}>
                  {address}
                </CustomText>
              </View>
              <TouchableOpacity>
                <Icon
                  name="chevron-right"
                  size={RFValue(20)}
                  color={Colors.text}
                />
              </TouchableOpacity>
            </View>

            {/* Address details */}
            <View style={styles.inputContainer}>
              <CustomText
                fontFamily={Fonts.Medium}
                variant="h8"
                style={styles.inputLabel}>
                Address details*
              </CustomText>
              <TextInput
                style={styles.textInput}
                placeholder="E.g. Floor, House no."
                placeholderTextColor="#999"
                value={addressDetails}
                onChangeText={setAddressDetails}
              />
            </View>

            {/* Receiver details */}
            <View style={styles.sectionHeader}>
              <CustomText
                fontFamily={Fonts.Medium}
                variant="h8"
                style={styles.sectionTitle}>
                Receiver details for this address
              </CustomText>
            </View>

            <View style={styles.receiverRow}>
              <View style={styles.receiverIcon}>
                <Icon name="phone" color={Colors.primary} size={RFValue(16)} />
              </View>
              <View style={{flex: 1}}>
                {user?.nmFirst && user?.nmLast && (
                  <>
                    <CustomText
                      fontFamily={Fonts.SemiBold}
                      variant="h9"
                      style={styles.receiverNameInput}>
                      {user?.nmFirst} {user?.nmLast}
                    </CustomText>
                    <CustomText
                      fontFamily={Fonts.Regular}
                      variant="h9"
                      style={styles.receiverPhoneInput}>
                      {user?.nbPhone}
                    </CustomText>
                  </>
                )}
              </View>
              <TouchableOpacity>
                <Icon
                  name="chevron-right"
                  size={RFValue(20)}
                  color={Colors.text}
                />
              </TouchableOpacity>
            </View>

            {/* Save address as */}
            <View style={styles.sectionHeader}>
              <CustomText
                fontFamily={Fonts.Medium}
                variant="h8"
                style={styles.sectionTitle}>
                Save address as
              </CustomText>
            </View>

            <View style={styles.addressTypeRow}>
              <TouchableOpacity
                style={[
                  styles.addressTypeBtn,
                  selectedAddressType === 'Home' && styles.addressTypeBtnActive,
                ]}
                onPress={() => setSelectedAddressType('Home')}>
                <Icon
                  name="home"
                  size={RFValue(16)}
                  color={
                    selectedAddressType === 'Home' ? Colors.primary : '#666'
                  }
                />
                <CustomText
                  fontFamily={Fonts.Medium}
                  variant="h9"
                  style={{
                    color:
                      selectedAddressType === 'Home' ? Colors.primary : '#666',
                    fontSize: RFValue(11),
                  }}>
                  Home
                </CustomText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.addressTypeBtn,
                  selectedAddressType === 'Work' && styles.addressTypeBtnActive,
                ]}
                onPress={() => setSelectedAddressType('Work')}>
                <Icon
                  name="briefcase"
                  size={RFValue(16)}
                  color={
                    selectedAddressType === 'Work' ? Colors.primary : '#666'
                  }
                />
                <CustomText
                  fontFamily={Fonts.Medium}
                  variant="h9"
                  style={{
                    color:
                      selectedAddressType === 'Work' ? Colors.primary : '#666',
                    fontSize: RFValue(11),
                  }}>
                  Work
                </CustomText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.addressTypeBtn,
                  selectedAddressType === 'Other' &&
                    styles.addressTypeBtnActive,
                ]}
                onPress={() => setSelectedAddressType('Other')}>
                <Icon
                  name="map-marker"
                  size={RFValue(16)}
                  color={
                    selectedAddressType === 'Other' ? Colors.primary : '#666'
                  }
                />
                <CustomText
                  fontFamily={Fonts.Medium}
                  variant="h9"
                  style={{
                    color:
                      selectedAddressType === 'Other' ? Colors.primary : '#666',
                    fontSize: RFValue(11),
                  }}>
                  Other
                </CustomText>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Save button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.saveBtn} onPress={onSaveAddress}>
            <CustomText
              fontFamily={Fonts.SemiBold}
              variant="h6"
              style={{color: '#fff'}}>
              Save address
            </CustomText>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
    marginTop: RFValue(8),
    marginBottom: RFValue(6),
    zIndex: 1000,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RFValue(8),
    backgroundColor: '#f5f5f5',
    paddingHorizontal: RFValue(12),
    paddingVertical: RFValue(7),
  },
  searchInput: {
    flex: 1,
    marginLeft: RFValue(8),
    fontFamily: Fonts.Regular,
    color: Colors.text,
    padding: 0,
    fontSize: RFValue(8),
  },
  mapContainer: {
    height: RFValue(220),
    marginHorizontal: RFValue(12),
    borderRadius: RFValue(12),
    overflow: 'hidden',
    marginBottom: RFValue(12),
  },
  map: {
    ...StyleSheet.absoluteFillObject,
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
    bottom: RFValue(12),
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
    paddingVertical: RFValue(6),
    borderRadius: RFValue(20),
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 6,
    elevation: 3,
  },
  currentLocationText: {
    color: Colors.text,
  },
  formSection: {
    paddingHorizontal: RFValue(12),
    paddingBottom: RFValue(72),
  },
  sectionHeader: {
    marginTop: RFValue(10),
    marginBottom: RFValue(6),
  },
  sectionTitle: {
    color: Colors.text,
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RFValue(12),
    backgroundColor: '#fff',
    borderRadius: RFValue(12),
    padding: RFValue(10),
    borderWidth: 1,
    borderColor: '#e6e6e6',
  },
  addressIcon: {
    width: RFValue(36),
    height: RFValue(36),
    borderRadius: RFValue(18),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef7ef',
  },
  inputContainer: {
    marginTop: RFValue(10),
  },
  inputLabel: {
    marginBottom: RFValue(6),
    color: '#666',
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: RFValue(8),
    borderWidth: 1,
    borderColor: '#e6e6e6',
    paddingHorizontal: RFValue(12),
    paddingVertical: RFValue(10),
    fontFamily: Fonts.Regular,
    fontSize: RFValue(12),
    color: Colors.text,
  },
  receiverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RFValue(12),
    backgroundColor: '#fff',
    borderRadius: RFValue(12),
    padding: RFValue(10),
    borderWidth: 1,
    borderColor: '#e6e6e6',
  },
  receiverIcon: {
    width: RFValue(36),
    height: RFValue(36),
    borderRadius: RFValue(18),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef7ef',
  },
  receiverNameInput: {
    color: Colors.text,
    padding: 0,
    marginBottom: RFValue(2),
  },
  receiverPhoneInput: {
    color: '#666',
    padding: 0,
  },
  addressTypeRow: {
    flexDirection: 'row',
    gap: RFValue(8),
  },
  addressTypeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: RFValue(6),
    backgroundColor: '#fff',
    borderRadius: RFValue(8),
    borderWidth: 1,
    borderColor: '#e6e6e6',
    paddingVertical: RFValue(10),
  },
  addressTypeBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: '#eef7ef',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: RFValue(10),
    paddingVertical: RFValue(8),
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    // paddingBottom: Platform.OS === 'ios' ? RFValue(12) : RFValue(8),
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: RFValue(10),
    paddingVertical: RFValue(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AddressSelection;
