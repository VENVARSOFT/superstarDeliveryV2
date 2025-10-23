import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
} from 'react-native';
import CustomText from '@components/ui/CustomText';
import {Fonts} from '@utils/Constants';
import {RFValue} from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {navigate} from '@utils/NavigationUtils';
import {getAddresses, AddressResponse} from '@service/addressService';
import {useAuthStore} from '@state/authStore';

const {height: screenHeight} = Dimensions.get('window');

interface Address {
  id: string;
  label: string;
  address: string;
  phone?: string;
  distance?: string;
  isCurrent?: boolean;
}

interface AddressSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onAddressSelect: (address: Address) => void;
  currentAddress?: string;
}

const AddressSelectionModal: React.FC<AddressSelectionModalProps> = ({
  visible,
  onClose,
  onAddressSelect,
}) => {
  const [searchText, setSearchText] = useState('');
  const [apiAddresses, setApiAddresses] = useState<AddressResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const {user} = useAuthStore();

  const fetchAddresses = useCallback(async () => {
    if (!user?.idUser) return;

    setLoading(true);
    try {
      const response = await getAddresses(user.idUser, 1);
      if (response?.success && response.data) {
        setApiAddresses(response.data);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.idUser]);

  // Fetch addresses from API when modal opens
  useEffect(() => {
    if (visible && user?.idUser) {
      fetchAddresses();
    }
  }, [visible, user?.idUser, fetchAddresses]);

  // Convert API address to display format
  const convertApiAddressToDisplay = (apiAddress: AddressResponse): Address => {
    return {
      id: apiAddress.idAddress.toString(),
      label: apiAddress.txAddressType || 'Home',
      address: apiAddress.txFormattedAddress || 'Address not available',
      phone: apiAddress.txPhone || undefined,
      isCurrent: false, // You can implement logic to determine if this is current
    };
  };

  // Combine API addresses with dummy data for now
  const savedAddresses: Address[] = [
    ...apiAddresses.map(convertApiAddressToDisplay),
    // Keep some dummy data as fallback
    // {
    //   id: 'dummy-1',
    //   label: 'Home',
    //   address:
    //     '4th floor 402, Aditi Enclave, Sri Rama Colony, Madhapur, Hyderabad',
    //   phone: '9030187642',
    //   isCurrent: true,
    // },
  ];

  const locationOptions = [
    {
      id: 'current',
      icon: 'target',
      title: 'Use your current location',
      subtitle: '',
      color: '#4CAF50',
    },
    {
      id: 'add',
      icon: 'plus',
      title: 'Add new address',
      color: '#4CAF50',
    },
  ];

  const handleAddressSelect = (address: Address) => {
    onAddressSelect(address);
    onClose();
  };

  const handleLocationOptionPress = (option: any) => {
    if (option.id === 'current') {
      onClose();
      navigate('ConfirmLocation');
      return;
    } else if (option.id === 'add') {
      onClose();
      navigate('AddressSelection');
      return;
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.modalContainer, {paddingBottom: insets.bottom}]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.handle} />
            <CustomText
              fontFamily={Fonts.Bold}
              variant="h7"
              style={styles.title}>
              Select delivery location
            </CustomText>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Icon name="magnify" color="#666" size={RFValue(16)} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for area, street name..."
              placeholderTextColor="#999"
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}>
            {/* Location Options */}
            {locationOptions.map(option => (
              <TouchableOpacity
                key={option.id}
                style={styles.optionItem}
                onPress={() => handleLocationOptionPress(option)}>
                <View
                  style={[styles.optionIcon, {backgroundColor: option.color}]}>
                  <Icon name={option.icon} color="white" size={RFValue(12)} />
                </View>
                <View style={styles.optionContent}>
                  <CustomText
                    fontFamily={Fonts.Medium}
                    variant="h7"
                    style={styles.optionTitle}>
                    {option.title}
                  </CustomText>
                  {option.subtitle && (
                    <CustomText
                      fontFamily={Fonts.Regular}
                      variant="h8"
                      style={styles.optionSubtitle}>
                      {option.subtitle}
                    </CustomText>
                  )}
                </View>
                <Icon name="chevron-right" color="#666" size={RFValue(16)} />
              </TouchableOpacity>
            ))}

            {/* Saved Addresses Section */}
            <View style={styles.sectionHeader}>
              <CustomText
                fontFamily={Fonts.SemiBold}
                variant="h7"
                style={styles.sectionTitle}>
                Your saved addresses
              </CustomText>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <CustomText
                  fontFamily={Fonts.Regular}
                  variant="h8"
                  style={styles.loadingText}>
                  Loading addresses...
                </CustomText>
              </View>
            ) : savedAddresses.length === 0 ? (
              <View style={styles.emptyContainer}>
                <CustomText
                  fontFamily={Fonts.Regular}
                  variant="h8"
                  style={styles.emptyText}>
                  No saved addresses found
                </CustomText>
              </View>
            ) : (
              savedAddresses.map(address => (
                <TouchableOpacity
                  key={address.id}
                  style={styles.addressItem}
                  onPress={() => handleAddressSelect(address)}>
                  <View style={styles.addressIcon}>
                    <Icon name="home" color="#FFD700" size={RFValue(16)} />
                  </View>
                  <View style={styles.addressContent}>
                    <View style={styles.addressHeader}>
                      <CustomText
                        fontFamily={Fonts.SemiBold}
                        variant="h8"
                        style={styles.addressLabel}>
                        {address.label}
                      </CustomText>
                      <CustomText
                        fontFamily={Fonts.Regular}
                        variant="h8"
                        style={styles.addressStatus}>
                        {address.isCurrent ? 'You are here' : address.distance}
                      </CustomText>
                    </View>
                    <CustomText
                      fontFamily={Fonts.Regular}
                      variant="h9"
                      style={styles.addressText}
                      numberOfLines={2}>
                      {address.address}
                    </CustomText>
                    {address.phone && (
                      <CustomText
                        fontFamily={Fonts.Regular}
                        variant="h8"
                        style={styles.phoneText}>
                        {address.phone}
                      </CustomText>
                    )}
                  </View>
                  <View style={styles.addressActions}>
                    <TouchableOpacity style={styles.actionButton}>
                      <Icon
                        name="dots-horizontal"
                        color="#666"
                        size={RFValue(12)}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                      <Icon name="arrow-up" color="#666" size={RFValue(12)} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.9,
    minHeight: screenHeight * 0.8,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 12,
    alignItems: 'center',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#D0D0D0',
    borderRadius: 2,
    marginBottom: 8,
  },
  title: {
    color: '#000',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: RFValue(13),
    fontFamily: Fonts.Regular,
    color: '#000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E8E8E8',
  },
  optionIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    color: '#000',
    marginBottom: 2,
    fontWeight: '500',
  },
  optionSubtitle: {
    color: '#666',
    marginTop: 2,
  },
  sectionHeader: {
    marginTop: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#000',
    fontWeight: '600',
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E8E8E8',
  },
  addressIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  addressContent: {
    flex: 1,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  addressLabel: {
    color: '#000',
    marginRight: 8,
    fontWeight: '600',
  },
  addressStatus: {
    color: '#666',
    fontSize: RFValue(11),
  },
  addressText: {
    color: '#333',
    lineHeight: 18,
    marginBottom: 3,
  },
  phoneText: {
    color: '#666',
    fontSize: RFValue(10),
  },
  addressActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  actionButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 3,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
  },
  emptyContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
  },
});

export default AddressSelectionModal;
