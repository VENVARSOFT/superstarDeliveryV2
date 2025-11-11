import React, {FC, useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {RFValue} from 'react-native-responsive-fontsize';
import CustomText from '@components/ui/CustomText';
import {Colors, Fonts} from '@utils/Constants';
import {goBack, navigate} from '@utils/NavigationUtils';
import {useAuthStore} from '@state/authStore';
import {getAddresses, AddressResponse} from '@service/addressService';

interface AddressCardProps {
  address: AddressResponse;
  onEdit: (address: AddressResponse) => void;
  distance?: string;
}

const AddressCard: FC<AddressCardProps> = ({
  address,
  onEdit,
  distance = '0 m',
}) => {
  const getAddressIcon = (type: string | null) => {
    switch (type?.toLowerCase()) {
      case 'home':
        return 'home';
      case 'work':
        return 'briefcase';
      default:
        return 'map-marker';
    }
  };

  const getAddressType = (type: string | null) => {
    switch (type?.toLowerCase()) {
      case 'home':
        return 'Home';
      case 'work':
        return 'Work';
      default:
        return 'Other';
    }
  };

  return (
    <View style={styles.addressCard}>
      <View style={styles.addressCardLeft}>
        <View style={styles.addressIconContainer}>
          <Icon
            name={getAddressIcon(address.txAddressType)}
            size={RFValue(10)}
            color={Colors.primary}
          />
        </View>
        {/* <CustomText variant="h9" style={styles.distanceText}>
          {distance}
        </CustomText> */}
      </View>

      <View style={styles.addressCardContent}>
        <CustomText
          variant="h8"
          fontFamily={Fonts.SemiBold}
          style={styles.addressType}>
          {getAddressType(address.txAddressType)}
        </CustomText>
        <CustomText variant="h8" style={styles.addressText} numberOfLines={3}>
          {address.txFormattedAddress || 'Address not available'}
        </CustomText>
        {address.txPhone && (
          <CustomText variant="h8" style={styles.phoneText}>
            Phone number: {address.txPhone}
          </CustomText>
        )}
      </View>

      {/* <View style={styles.addressCardActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onEdit(address)}>
          <Icon
            name="dots-horizontal"
            size={RFValue(16)}
            color={Colors.primary}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onEdit(address)}>
          <Icon
            name="share-variant"
            size={RFValue(16)}
            color={Colors.primary}
          />
        </TouchableOpacity>
      </View> */}
    </View>
  );
};

const AddressBook: FC = () => {
  const [addresses, setAddresses] = useState<AddressResponse[]>([]);
  const {user} = useAuthStore();

  useEffect(() => {
    const fetchAddresses = async () => {
      if (!user?.idUser) return;
      try {
        const response = await getAddresses(user.idUser);
        if (response?.success && response.data) {
          setAddresses(response.data);
        }
      } catch (error) {
        console.error('Error fetching addresses:', error);
      }
    };
    fetchAddresses();
  }, [user?.idUser]);

  const handleAddAddress = () => {
    navigate('AddressSelection');
  };

  const handleImportFromBlinkit = () => {
    // TODO: Implement Blinkit import functionality
  };

  const handleEditAddress = (address: AddressResponse) => {
    // TODO: Navigate to edit address screen
  };

  // const handleDeleteAddress = (address: AddressResponse) => {
  //   Alert.alert(
  //     'Delete Address',
  //     'Are you sure you want to delete this address?',
  //     [
  //       {text: 'Cancel', style: 'cancel'},
  //       {
  //         text: 'Delete',
  //         style: 'destructive',
  //         onPress: () => {
  //           // TODO: Implement delete address functionality
  //           console.log('Delete address:', address.idAddress);
  //         },
  //       },
  //     ],
  //   );
  // };

  const renderAddressCard = ({item}: {item: AddressResponse}) => (
    <AddressCard
      address={item}
      onEdit={handleEditAddress}
      distance="0 m" // TODO: Calculate actual distance
    />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <TouchableOpacity onPress={goBack} style={styles.backButton}>
        <Icon name="chevron-left" size={RFValue(24)} color={Colors.text} />
      </TouchableOpacity>
      <CustomText
        variant="h6"
        fontFamily={Fonts.SemiBold}
        style={styles.headerTitle}>
        My Addresses
      </CustomText>
      <View style={styles.headerSpacer} />
    </View>
  );

  const renderActionButtons = () => (
    <View style={styles.actionButtonsContainer}>
      <TouchableOpacity
        style={styles.actionButtonRow}
        onPress={handleAddAddress}>
        <View style={styles.actionButtonLeft}>
          <View style={styles.addIconContainer}>
            <Icon name="plus" size={RFValue(20)} color="#fff" />
          </View>
          <CustomText
            variant="h8"
            fontFamily={Fonts.SemiBold}
            style={styles.actionButtonText}>
            Add address
          </CustomText>
        </View>
        <Icon name="chevron-right" size={RFValue(20)} color={Colors.text} />
      </TouchableOpacity>

      {/* <TouchableOpacity
        style={styles.actionButtonRow}
        onPress={handleImportFromBlinkit}>
        <View style={styles.actionButtonLeft}>
          <View style={styles.blinkitIconContainer}>
            <CustomText
              variant="h9"
              fontFamily={Fonts.SemiBold}
              style={styles.blinkitText}>
              blinkit
            </CustomText>
          </View>
          <CustomText
            variant="h6"
            fontFamily={Fonts.SemiBold}
            style={styles.actionButtonText}>
            Import addresses from Blinkit
          </CustomText>
        </View>
        <Icon name="chevron-right" size={RFValue(20)} color={Colors.text} />
      </TouchableOpacity> */}
    </View>
  );

  const renderSavedAddressesHeader = () => (
    <View style={styles.savedAddressesHeader}>
      <CustomText
        variant="h8"
        fontFamily={Fonts.SemiBold}
        style={styles.savedAddressesTitle}>
        SAVED ADDRESSES
      </CustomText>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}

      <FlatList
        data={addresses}
        renderItem={renderAddressCard}
        keyExtractor={item => item.idAddress.toString()}
        ListHeaderComponent={
          <View>
            {renderActionButtons()}
            {renderSavedAddressesHeader()}
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: RFValue(12),
    paddingVertical: RFValue(4),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: RFValue(4),
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: Colors.text,
  },
  headerSpacer: {
    width: RFValue(32),
  },
  actionButtonsContainer: {
    paddingHorizontal: RFValue(12),
    paddingVertical: RFValue(4),
  },
  actionButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: RFValue(10),
    paddingVertical: RFValue(12),
    paddingHorizontal: RFValue(12),

    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 2},
    elevation: 1,
  },
  actionButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  addIconContainer: {
    width: RFValue(18),
    height: RFValue(18),
    borderRadius: RFValue(14),
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: RFValue(10),
  },
  blinkitIconContainer: {
    width: RFValue(28),
    height: RFValue(28),
    borderRadius: RFValue(6),
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: RFValue(10),
  },
  blinkitText: {
    color: '#fff',
    fontSize: RFValue(8),
  },
  actionButtonText: {
    color: Colors.primary,
  },
  savedAddressesHeader: {
    alignItems: 'center',
    paddingVertical: RFValue(4),
  },
  savedAddressesTitle: {
    color: '#999',
    letterSpacing: 0.5,
  },
  listContent: {
    paddingBottom: RFValue(12),
  },
  addressCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: RFValue(10),
    padding: RFValue(12),
    marginHorizontal: RFValue(12),
    marginBottom: RFValue(10),
    borderWidth: 1,
    borderColor: '#f2f2f2',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 2},
    elevation: 1,
  },
  addressCardLeft: {
    alignItems: 'center',
    justifyContent: 'center',

    marginRight: RFValue(12),
  },
  addressIconContainer: {
    width: RFValue(34),
    height: RFValue(34),
    borderRadius: RFValue(17),
    backgroundColor: '#eef7ef',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: RFValue(6),
  },
  distanceText: {
    color: '#666',
    fontSize: RFValue(9),
  },
  addressCardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  addressType: {
    color: Colors.text,
    marginBottom: RFValue(2),
  },
  addressText: {
    color: Colors.text,
    lineHeight: RFValue(14),
    marginBottom: RFValue(2),
  },
  phoneText: {
    color: '#666',
    fontSize: RFValue(9),
  },
  addressCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: RFValue(28),
    height: RFValue(28),
    borderRadius: RFValue(14),
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: RFValue(6),
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 1},
    elevation: 1,
  },
});

export default AddressBook;
