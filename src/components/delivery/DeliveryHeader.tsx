import {View, StyleSheet, TouchableOpacity, Platform} from 'react-native';
import React, {FC} from 'react';
import {Colors, Fonts} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import {resetAndNavigate} from '@utils/NavigationUtils';
import {useAuthStore} from '@state/authStore';
import {tokenManager} from '@utils/tokenManager';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {RFValue} from 'react-native-responsive-fontsize';

interface DeliveryHeaderProps {
  name?: string;
  email?: string;
}

const DeliveryHeader: FC<DeliveryHeaderProps> = ({name, email}) => {
  const {logout, user} = useAuthStore();
  console.log('user', user);

  // Get user name from Redux state
  const userName = user
    ? `${user.nmFirst || ''} ${user.nmLast || ''}`.trim()
    : '';
  const userEmail = user?.idEmail || '';

  // Use props if provided, otherwise use Redux data
  const displayName = name || userName;
  const displayEmail = email || userEmail;

  return (
    <View style={styles.subContainer}>
      <View style={styles.infoContainer}>
        <CustomText
          variant="h4"
          fontFamily={Fonts.SemiBold}
          style={styles.text}>
          Hello {displayName || user?.nbPhone}
        </CustomText>
        <CustomText variant="h8" fontFamily={Fonts.Medium}>
          {displayEmail}
        </CustomText>
      </View>

      {/* <TouchableOpacity
        onPress={() => {
          logout();
          tokenManager.clearTokens();
          resetAndNavigate('CustomerLogin');
        }}
        style={styles.logoutButton}>
        <Icon name="logout" size={RFValue(14)} color={Colors.text_secondary} />
      </TouchableOpacity> */}
      <TouchableOpacity
        onPress={() => {
          resetAndNavigate('DeliveryProfile');
        }}
        style={[styles.logoutButton, {marginRight: 8}]}>
        <Icon
          name="account-circle"
          size={RFValue(22)}
          color={Colors.text_secondary}
        />
      </TouchableOpacity>
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
  subContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingTop: Platform.OS === 'android' ? 1 : 0,
    paddingBottom: 1,
    justifyContent: 'space-between',
  },
  infoContainer: {
    flex: 1,
    paddingRight: 10,
  },
  logoutButton: {
    backgroundColor:
      Platform.OS === 'ios'
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(255, 255, 255, 0.1)',
    borderRadius: RFValue(18),
    width: RFValue(36),
    height: RFValue(36),
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
});

export default DeliveryHeader;
