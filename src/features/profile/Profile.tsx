import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import React, {useEffect, useState, useCallback, useRef} from 'react';
import {useAuthStore} from '@state/authStore';
import {useCartStore} from '@state/cartStore';
import {fetchCustomerOrders} from '@service/orderService';
import {getUserDetails, updateUserProfile} from '@service/authService';
import CustomHeader from '@components/ui/CustomHeader';
import ProfileOrderItem from './ProfileOrderItem';
import CustomText from '@components/ui/CustomText';
import {Fonts, Colors} from '@utils/Constants';
import ActionButton from './ActionButton';
import {resetAndNavigate, navigate} from '@utils/NavigationUtils';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {tokenManager} from '@utils/tokenManager';
import {RFValue} from 'react-native-responsive-fontsize';
import CustomInput from '@components/ui/CustomInput';
import CustomButton from '@components/ui/CustomButton';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import socketService from '@service/socketService';
const {height: screenHeight} = Dimensions.get('window');

interface UserDetails {
  idUser: number;
  nmFirst: string | null;
  nmLast: string | null;
  nmUserType: string;
  nmRole: string | null;
  adWork: string | null;
  adHome: string | null;
  adOther: string | null;
  idTenant: string | null;
  idEmail: string | null;
  nbPhone: string;
  txPassword: string;
  nbRecentOtp: string | null;
  dtCreated: string;
  dtUpdated: string;
  flActive: boolean;
  cdSegmentType: string | null;
  nmBusiness: string | null;
  txTaxId: string | null;
  nbCreditLimit: string | null;
  cdLoyalityTier: string | null;
  flVerified: boolean;
  cdCommPref: string | null;
  flEmailNotifications: boolean;
  flEmailMarketings: boolean;
  flEmailNewsletter: boolean;
  flSmsUpdates: boolean;
  txNotes: string | null;
  txLongitude: string | null;
  txLatitude: string | null;
}

const Profile = () => {
  const [orders, setOrders] = useState([]);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const {logout, user} = useAuthStore();
  const {clearCart} = useCartStore();
  const insets = useSafeAreaInsets();

  // Animation values for the toggle
  const toggleAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const iconRotation = useRef(new Animated.Value(0)).current;

  const fetchOrders = useCallback(async () => {
    const data = await fetchCustomerOrders(user?._id);
    setOrders(data);
  }, [user?._id]);

  const fetchUserDetails = useCallback(async () => {
    if (user?.idUser && user?.nbPhone) {
      setLoading(true);
      try {
        const response = await getUserDetails(user.idUser, user.nbPhone);
        if (response.success && response.data) {
          setUserDetails(response.data);
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
      } finally {
        setLoading(false);
      }
    }
  }, [user?.idUser, user?.nbPhone]);

  const handleNavigateToRideTracking = async () => {
    try {
      // Check if socket is already connected
      const isConnected = socketService.getConnectionStatus();

      if (!isConnected) {
        // Get token and connect socket
        const token = await tokenManager.getValidAccessToken();

        if (!token) {
          Alert.alert('Error', 'Authentication token not available');
          return;
        }

        // Show loading indicator
        setLoading(true);

        const connected = await socketService.connect(token);

        setLoading(false);

        if (!connected) {
          Alert.alert(
            'Connection Error',
            'Failed to connect to server. Please try again.',
          );
          return;
        }
      }

      // Navigate to RideTrackingScreen
      // Using a placeholder rideId - you may want to get this from active orders or user context
      const rideId =
        orders && orders.length > 0 ? orders[0]?.orderId : 'test-ride-id';
      navigate('RideTracking', {rideId});
    } catch (error) {
      console.error('Error navigating to ride tracking:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to connect. Please try again.');
    }
  };

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);

    // Animate the toggle switch
    Animated.parallel([
      Animated.timing(toggleAnimation, {
        toValue: newMode ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.sequence([
        Animated.timing(scaleAnimation, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(iconRotation, {
        toValue: newMode ? 1 : 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    fetchOrders();
    fetchUserDetails();
  }, [fetchOrders, fetchUserDetails]);

  const openEdit = () => {
    setFirstName(userDetails?.nmFirst || '');
    setLastName(userDetails?.nmLast || '');
    setEmail(userDetails?.idEmail || '');
    setPhone(userDetails?.nbPhone || user?.phone || '');
    setEditVisible(true);
  };

  const onSaveProfile = async () => {
    try {
      setSaving(true);
      const payload: any = {
        idUser: user?.idUser || userDetails?.idUser,
        nmFirst: firstName?.trim() || null,
        nmLast: lastName?.trim() || null,
        nmUserType: userDetails?.nmUserType || 'CUSTOMER',
        nmRole: userDetails?.nmRole || 'USER',
        nbPhone: phone?.trim() || undefined,
        idEmail: email?.trim() || null,
        txPassword: userDetails?.txPassword || undefined,
      };
      const resp = await updateUserProfile(payload);
      if (resp?.success) {
        await fetchUserDetails();
        // If phone changed, refetch using new phone
        if (phone && user?.idUser) {
          try {
            const r = await getUserDetails(user.idUser, phone);
            if (r?.success && r?.data) setUserDetails(r.data);
          } catch {}
        }
        setEditVisible(false);
      } else {
        Alert.alert('Update failed', resp?.error || 'Please try again');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const renderHeader = () => {
    const displayName =
      userDetails?.nmFirst && userDetails?.nmLast
        ? `${userDetails.nmFirst} ${userDetails.nmLast}`.trim()
        : userDetails?.nmFirst || userDetails?.nmLast || 'Customer';

    const displayPhone = userDetails?.nbPhone || user?.phone || '';

    return (
      <View>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <CustomText
              variant="h7"
              fontFamily={Fonts.Medium}
              style={styles.loadingText}>
              Loading...
            </CustomText>
          </View>
        ) : (
          <>
            {/* User Profile Section */}
            <View style={styles.userProfileSection}>
              <View style={styles.userNameRow}>
                <CustomText
                  variant="h7"
                  fontFamily={Fonts.Bold}
                  style={styles.userName}>
                  {displayName}
                </CustomText>
                <TouchableOpacity onPress={openEdit} style={styles.editBtn}>
                  <Icon
                    name="pencil"
                    size={RFValue(18)}
                    color={Colors.primary}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.userInfoRow}>
                <View style={styles.userInfoItem}>
                  <Icon name="phone" size={RFValue(12)} color={Colors.text} />
                  <CustomText
                    variant="h8"
                    fontFamily={Fonts.Medium}
                    style={styles.userInfoText}>
                    {displayPhone}
                  </CustomText>
                </View>
                {/* <View style={styles.userInfoItem}>
                  <Icon name="cake" size={RFValue(16)} color={Colors.text} />
                  <CustomText
                    variant="h8"
                    fontFamily={Fonts.Medium}
                    style={styles.userInfoText}>
                    12 Feb 1997
                  </CustomText>
                </View> */}
              </View>
            </View>

            {/* Quick Access Buttons */}
            <View style={styles.quickAccessSection}>
              <TouchableOpacity style={styles.quickAccessButton}>
                <Icon name="wallet" size={RFValue(20)} color={Colors.text} />
                <CustomText
                  variant="h9"
                  fontFamily={Fonts.Medium}
                  style={styles.quickAccessText}>
                  Golisoda Money
                </CustomText>
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickAccessButton}>
                <Icon
                  name="file-document"
                  size={RFValue(20)}
                  color={Colors.text}
                />
                <CustomText
                  variant="h9"
                  fontFamily={Fonts.Medium}
                  style={styles.quickAccessText}>
                  Support
                </CustomText>
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickAccessButton}>
                <Icon
                  name="credit-card"
                  size={RFValue(20)}
                  color={Colors.text}
                />
                <CustomText
                  variant="h9"
                  fontFamily={Fonts.Medium}
                  style={styles.quickAccessText}>
                  Payments
                </CustomText>
              </TouchableOpacity>
            </View>

            {/* App Settings Section */}
            <View style={styles.settingsSection}>
              <TouchableOpacity
                style={styles.settingItem}
                onPress={toggleTheme}>
                <View style={styles.settingLeft}>
                  <Animated.View
                    style={[
                      styles.iconContainer,
                      {
                        transform: [
                          {
                            rotate: iconRotation.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0deg', '180deg'],
                            }),
                          },
                        ],
                      },
                    ]}>
                    <Icon
                      name={isDarkMode ? 'weather-night' : 'weather-sunny'}
                      size={RFValue(20)}
                      color={isDarkMode ? '#FFD700' : '#FFA500'}
                    />
                  </Animated.View>
                  <CustomText
                    variant="h7"
                    fontFamily={Fonts.Medium}
                    style={styles.settingText}>
                    Appearance
                  </CustomText>
                </View>
                <Animated.View
                  style={[
                    styles.animatedToggleContainer,
                    {
                      transform: [{scale: scaleAnimation}],
                    },
                  ]}>
                  <Animated.View
                    style={[
                      styles.toggleTrack,
                      {
                        backgroundColor: toggleAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['#E0E0E0', '#4A90E2'],
                        }),
                      },
                    ]}>
                    <Animated.View
                      style={[
                        styles.toggleThumb,
                        {
                          transform: [
                            {
                              translateX: toggleAnimation.interpolate({
                                inputRange: [0, 1],
                                outputRange: [2, 22],
                              }),
                            },
                          ],
                        },
                      ]}>
                      <Animated.View
                        style={[
                          styles.toggleIcon,
                          {
                            opacity: toggleAnimation.interpolate({
                              inputRange: [0, 0.5, 1],
                              outputRange: [1, 0, 1],
                            }),
                          },
                        ]}>
                        <Icon
                          name={isDarkMode ? 'weather-night' : 'weather-sunny'}
                          size={RFValue(12)}
                          color={isDarkMode ? '#4A90E2' : '#FFA500'}
                        />
                      </Animated.View>
                    </Animated.View>
                  </Animated.View>
                </Animated.View>
              </TouchableOpacity>

              {/* <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Icon
                    name="eye-off"
                    size={RFValue(20)}
                    color={Colors.primary}
                  />
                  <View style={styles.settingTextContainer}>
                    <CustomText
                      variant="h7"
                      fontFamily={Fonts.Medium}
                      style={styles.settingText}>
                      Hide sensitive items
                    </CustomText>
                    <CustomText
                      variant="h8"
                      fontFamily={Fonts.Regular}
                      style={styles.settingDescription}>
                      Sexual wellness, nicotine products and other sensitive
                      items will be hidden
                    </CustomText>
                    <CustomText
                      variant="h8"
                      fontFamily={Fonts.Medium}
                      style={styles.knowMoreText}>
                      Know more
                    </CustomText>
                  </View>
                </View>
                <View style={styles.toggleContainer}>
                  <View style={styles.toggleOff} />
                </View>
              </View> */}
            </View>

            {/* Your Information Section */}
            <CustomText
              variant="h9"
              fontFamily={Fonts.Medium}
              style={styles.sectionHeader}>
              YOUR INFORMATION
            </CustomText>

            <ActionButton
              icon="cube-outline"
              label="Your orders"
              onPress={() => navigate('Orders')}
            />
            <ActionButton
              icon="heart"
              label="Your wishlist"
              onPress={() => {}}
            />
            <ActionButton
              icon="book-outline"
              label="Address book"
              onPress={() => navigate('AddressBook')}
            />
            <ActionButton
              icon="gift"
              label="E-gift cards"
              onPress={() => navigate('RewardsScreen')}
            />
            <ActionButton
              icon="map-marker"
              label="Ride Tracking"
              onPress={handleNavigateToRideTracking}
            />

            {/* Feeding India Section */}

            <ActionButton
              icon="information-circle-outline"
              label="About us"
              onPress={() => {}}
            />
            <ActionButton
              icon="log-out-outline"
              label="Logout"
              onPress={() => {
                clearCart();
                logout();
                // Clear tokenManager storage
                tokenManager.clearTokens();
                resetAndNavigate('Login');
              }}
            />

            {/* App Version Section */}
            <View style={styles.versionSection}>
              <CustomText
                variant="h7"
                fontFamily={Fonts.Bold}
                style={styles.appName}>
                GoliSoda
              </CustomText>
              <CustomText
                variant="h8"
                fontFamily={Fonts.Regular}
                style={styles.versionText}>
                v1.0.0 (1)
              </CustomText>
            </View>
          </>
        )}
      </View>
    );
  };

  const renderOrders = ({item, index}: any) => {
    return <ProfileOrderItem item={item} index={index} />;
  };

  return (
    <View style={styles.container}>
      <CustomHeader title="Profile" />
      <FlatList
        data={orders}
        ListHeaderComponent={renderHeader}
        renderItem={renderOrders}
        keyExtractor={(item: any) => item?.orderId}
        contentContainerStyle={styles.scrollViewContent}
      />

      {/* Edit Profile Modal */}
      <Modal
        visible={editVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditVisible(false)}>
        <View style={styles.sheetOverlay}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => setEditVisible(false)}
          />
          <View
            style={[
              styles.sheetContainer,
              {paddingBottom: insets.bottom || 16},
            ]}>
            <View style={styles.sheetHeader}>
              <CustomText variant="h6" fontFamily={Fonts.SemiBold}>
                Edit profile
              </CustomText>
              <TouchableOpacity onPress={() => setEditVisible(false)}>
                <Icon name="close" size={RFValue(20)} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <CustomText variant="h8" style={styles.inputLabel}>
                First name
              </CustomText>
              <CustomInput
                left={
                  <View style={styles.leftIconWrap}>
                    <Icon
                      name="account"
                      size={RFValue(16)}
                      color={Colors.secondary}
                    />
                  </View>
                }
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First name"
                right
                onClear={() => setFirstName('')}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <CustomText variant="h8" style={styles.inputLabel}>
                Last name
              </CustomText>
              <CustomInput
                left={
                  <View style={styles.leftIconWrap}>
                    <Icon
                      name="account"
                      size={RFValue(16)}
                      color={Colors.secondary}
                    />
                  </View>
                }
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last name"
                right
                onClear={() => setLastName('')}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <CustomText variant="h8" style={styles.inputLabel}>
                Email
              </CustomText>
              <CustomInput
                left={
                  <View style={styles.leftIconWrap}>
                    <Icon
                      name="email"
                      size={RFValue(16)}
                      color={Colors.secondary}
                    />
                  </View>
                }
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                keyboardType="email-address"
                right
                onClear={() => setEmail('')}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <CustomText variant="h8" style={styles.inputLabel}>
                Phone number
              </CustomText>
              <CustomInput
                left={
                  <View style={styles.leftIconWrap}>
                    <Icon
                      name="phone"
                      size={RFValue(16)}
                      color={Colors.secondary}
                    />
                  </View>
                }
                value={phone}
                onChangeText={setPhone}
                placeholder="Phone number"
                keyboardType="phone-pad"
                right
                onClear={() => setPhone('')}
              />
            </View>

            <CustomButton
              title={saving ? 'Saving...' : 'Save changes'}
              onPress={onSaveProfile}
              disabled={saving}
              loading={saving}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollViewContent: {
    padding: 16,
    paddingTop: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  loadingText: {
    marginLeft: 10,
    color: Colors.primary,
  },

  // User Profile Section
  userProfileSection: {
    marginBottom: 20,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userName: {
    color: '#000',
    flex: 1,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  userInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    // gap: 6,
  },
  userInfoText: {
    color: '#666',
    marginLeft: 6,
  },
  editBtn: {
    padding: 8,
  },

  // Quick Access Section
  quickAccessSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  quickAccessButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    // gap: 8,
  },
  quickAccessText: {
    // fontSize: RFValue(12),
    color: '#666',
    textAlign: 'center',
  },

  // Settings Section
  settingsSection: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 20,
    padding: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingText: {
    color: '#000',
    marginBottom: 2,
  },
  settingDescription: {
    color: '#666',
    marginBottom: 4,
  },
  knowMoreText: {
    color: Colors.primary,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontSize: RFValue(14),
    color: '#000',
  },
  toggleContainer: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleOff: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
  },

  // Animated Toggle Styles
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animatedToggleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleTrack: {
    width: 50,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    paddingHorizontal: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  toggleIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Version Section
  versionSection: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
    paddingVertical: 20,
  },
  appName: {
    color: '#666',
    fontSize: RFValue(16),
    marginBottom: 4,
  },
  versionText: {
    color: '#999',
    fontSize: RFValue(12),
  },

  // Section Headers
  sectionHeader: {
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 12,
  },

  // Legacy styles (keeping for compatibility)
  customerName: {
    marginVertical: 5,
    color: Colors.primary,
  },
  phoneNumber: {
    marginBottom: 10,
    opacity: 0.7,
  },
  informativeText: {
    opacity: 0.7,
    marginTop: 10,
  },
  pastText: {
    marginVertical: 20,
    opacity: 0.7,
  },
  ordersSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    color: Colors.primary,
    marginRight: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.85,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  inputGroup: {
    marginTop: 3,
  },
  inputLabel: {
    marginBottom: 1,
    opacity: 0.8,
  },
  leftIconWrap: {
    width: 40,
    paddingLeft: 6,
    borderRightWidth: 0.5,
    borderRightColor: Colors.border,
    alignItems: 'center',
  },
  flex1: {
    flex: 1,
  },
});

export default Profile;
