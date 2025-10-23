import {View, StyleSheet, Platform, TouchableOpacity} from 'react-native';
import React, {FC, useCallback, useEffect, useState} from 'react';
import {useAuthStore} from '@state/authStore';
import Geolocation from '@react-native-community/geolocation';
import {reverseGeocode} from '@service/mapService';
import CustomText from '@components/ui/CustomText';
import {Colors, Fonts} from '@utils/Constants';
import {RFValue} from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {navigate} from '@utils/NavigationUtils';
import {updateUserLocation as persistUserLocation} from '@service/authService';
import AddressSelectionModal from './AddressSelectionModal';

const Header: FC<{showNotice: () => void}> = () => {
  const {setUser, user} = useAuthStore();
  const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);

  const updateUserLocation = useCallback(async () => {
    // New API: requestAuthorization takes no arguments
    Geolocation.requestAuthorization();
    Geolocation.getCurrentPosition(
      position => {
        const {latitude, longitude} = position.coords;
        reverseGeocode(latitude, longitude, setUser);
      },
      _error => {},
      {
        enableHighAccuracy: false,
        timeout: 10000,
      },
    );
  }, [setUser]);

  useEffect(() => {
    updateUserLocation();
  }, [updateUserLocation]);

  const handleAddressSelect = async (address: any) => {
    // Persist and update redux
    const nextUser = {...user, address: address.address} as any;
    setUser(nextUser);
    try {
      await persistUserLocation({address: address.address}, setUser);
    } catch {}
    setIsAddressModalVisible(false);
  };

  return (
    <View style={styles.subContainer}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setIsAddressModalVisible(true)}>
        <CustomText fontFamily={Fonts.Bold} variant="h7" style={styles.text}>
          Home
        </CustomText>
        <View style={styles.flexRowGap}>
          {/* <CustomText
            fontFamily={Fonts.SemiBold}
            variant="h8"
            style={styles.text}>
            15 minutes
          </CustomText> */}
          {/* <TouchableOpacity style={styles.noticeBtn} onPress={showNotice}>
            <CustomText
              fontSize={RFValue(5)}
              fontFamily={Fonts.SemiBold}
              style={{color: '#3B4886'}}>
              ⛈️ Rain
            </CustomText>
          </TouchableOpacity> */}
        </View>

        <View style={styles.flexRow}>
          <CustomText
            variant="h7"
            numberOfLines={1}
            fontFamily={Fonts.Medium}
            style={styles.text2}>
            {user?.address || 'Select Address'}
          </CustomText>
          <Icon
            name="menu-down"
            color={Colors.text_secondary}
            size={RFValue(20)}
          />
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigate('Profile')}>
        {user?.nmFirst ? (
          <View style={styles.userInitialContainer}>
            <CustomText style={styles.userInitial}>
              {user.nmFirst.charAt(0).toUpperCase()}
            </CustomText>
          </View>
        ) : (
          <Icon name="account-circle-outline" size={RFValue(36)} color="#fff" />
        )}
      </TouchableOpacity>
      <AddressSelectionModal
        visible={isAddressModalVisible}
        onClose={() => setIsAddressModalVisible(false)}
        onAddressSelect={handleAddressSelect}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  text: {
    color: Colors.text_secondary,
  },
  text2: {
    color: Colors.text_secondary,
    width: '90%',
    textAlign: 'auto',
    paddingLeft: 5,
  },
  flexRow: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
    width: '70%',
  },
  subContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: Platform.OS === 'android' ? 1 : 0,
    paddingBottom: 1,
    justifyContent: 'space-between',
  },
  flexRowGap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  noticeBtn: {
    backgroundColor: '#E8EAF5',
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 2,
    bottom: -2,
  },
  userInitialContainer: {
    width: RFValue(32),
    height: RFValue(32),
    borderRadius: RFValue(18),
    backgroundColor:
      Platform.OS === 'ios'
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: Platform.OS === 'ios' ? 1 : 0,
    borderColor:
      Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        }
      : {
          elevation: 1,
        }),
  },
  userInitial: {
    fontSize: RFValue(16),
    fontFamily: Fonts.Bold,
    color: Colors.text_secondary,
  },
});

export default Header;
