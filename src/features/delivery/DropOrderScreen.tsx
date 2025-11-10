import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import QRCode from 'react-native-qrcode-svg';
import {Fonts} from '@utils/Constants';

type Props = {
  route?: any;
  navigation?: any;
};

const {width, height} = Dimensions.get('window');
const PRIMARY_GREEN = '#00A86B';
const BLUE_COLOR = '#2563eb';

const DropOrderScreen: React.FC<Props> = ({navigation, route}) => {
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cash'>('upi');
  const [isCashCollected, setIsCashCollected] = useState(false);

  // Get order details from route params
  const orderDetails = route?.params?.orderDetails || {
    orderId: '7394870411',
    customerName: 'Kumar .k',
    customerAddress: 'flat 402 Aditi enclave Andra Basti Sri Rama',
    totalAmount: 345,
    customerPhone: '+91-9876543210',
  };

  const handleBack = useCallback(() => {
    navigation?.goBack();
  }, [navigation]);

  const handleViewCustomerPreference = useCallback(() => {
    // Show customer preference details
    Alert.alert(
      'Customer Preference',
      'Customer prefers UPI payment method. Please show the QR code for payment collection.',
      [{text: 'OK'}],
    );
  }, []);

  const handleCashCollected = useCallback(() => {
    setIsCashCollected(!isCashCollected);
  }, [isCashCollected]);

  const handleOrderDelivered = useCallback(() => {
    if (paymentMethod === 'cash' && !isCashCollected) {
      Alert.alert(
        'Payment Required',
        'Please collect cash payment before marking order as delivered.',
        [{text: 'OK'}],
      );
      return;
    }

    Alert.alert(
      'Order Delivered',
      'Order has been successfully delivered and payment collected.',
      [
        {
          text: 'OK',
          onPress: () => {
            // Navigate back to dashboard or next order
            navigation?.navigate('Home');
          },
        },
      ],
    );
  }, [paymentMethod, isCashCollected, navigation]);

  const handleCallCustomer = useCallback(() => {
    // Implement call customer functionality
    console.log('Calling customer:', orderDetails.customerPhone);
  }, [orderDetails.customerPhone]);

  const handleCallSupport = useCallback(() => {
    // Implement call support functionality
    console.log('Calling support');
  }, []);

  const handleProfile = useCallback(() => {
    // Navigate to profile
    navigation?.navigate('Profile');
  }, [navigation]);

  // Generate UPI payment string
  const upiPaymentString = `upi://pay?pa=zomato@paytm&pn=Zomato&am=${orderDetails.totalAmount}&cu=INR&tn=Order ${orderDetails.orderId}`;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <Icon name="chevron-down" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Drop order</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleCallSupport}>
            <Icon name="alert-circle" size={20} color="#ef4444" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleCallCustomer}>
            <Icon name="arrow-right-circle" size={20} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleProfile}>
            <Icon name="account-circle" size={20} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}>
        {/* Customer Preference Banner */}
        <View style={styles.preferenceBanner}>
          <View style={styles.preferenceContent}>
            <Icon name="send" size={20} color="white" />
            <Text style={styles.preferenceText}>
              Customer prefers UPI, show QR
            </Text>
          </View>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={handleViewCustomerPreference}>
            <Text style={styles.viewButtonText}>View</Text>
          </TouchableOpacity>
        </View>

        {/* Payment Collection Section */}
        <View style={styles.paymentSection}>
          {/* UPI Payment */}
          <View style={styles.paymentMethod}>
            <View style={styles.paymentHeader}>
              <Icon name="qrcode" size={24} color="#374151" />
              <Text style={styles.paymentTitle}>
                Collect ₹{orderDetails.totalAmount} via UPI
              </Text>
            </View>
            <Text style={styles.paymentSubtitle}>
              Payment goes directly to Zomato
            </Text>

            <View style={styles.qrContainer}>
              <QRCode
                value={upiPaymentString}
                size={200}
                color="#000000"
                backgroundColor="#ffffff"
              />
            </View>

            <View style={styles.upiBranding}>
              <Text style={styles.bhimText}>BHIM</Text>
              <Icon name="arrow-right" size={16} color="#000" />
              <Text style={styles.upiText}>UPI</Text>
              <Icon name="arrow-right" size={16} color="#000" />
            </View>

            <View style={styles.securityNote}>
              <Icon name="check-circle" size={16} color="#10b981" />
              <Text style={styles.securityText}>
                100% secure payment to Zomato
              </Text>
            </View>
          </View>

          {/* OR Separator */}
          <View style={styles.separator}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>OR</Text>
            <View style={styles.separatorLine} />
          </View>

          {/* Cash Payment */}
          <View style={styles.paymentMethod}>
            <View style={styles.paymentHeader}>
              <Icon name="currency-inr" size={24} color="#374151" />
              <Text style={styles.paymentTitle}>
                Collect cash: ₹{orderDetails.totalAmount}
              </Text>
            </View>
            <Text style={styles.orderIdText}>
              Order: {orderDetails.orderId}
            </Text>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={handleCashCollected}>
              <View
                style={[
                  styles.checkbox,
                  isCashCollected && styles.checkboxChecked,
                ]}>
                {isCashCollected && (
                  <Icon name="check" size={16} color="white" />
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Customer Details */}
        <View style={styles.customerSection}>
          <View style={styles.customerHeader}>
            <View style={styles.customerHeaderLeft}>
              <Icon name="account" size={20} color="#374151" />
              <Text style={styles.customerHeaderTitle}>Customer details</Text>
            </View>
            <Icon name="chevron-up" size={20} color="#6B7280" />
          </View>

          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{orderDetails.customerName}</Text>
            <Text style={styles.customerAddress}>
              {orderDetails.customerAddress}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.deliverButton,
            paymentMethod === 'cash' &&
              !isCashCollected &&
              styles.deliverButtonDisabled,
          ]}
          onPress={handleOrderDelivered}
          disabled={paymentMethod === 'cash' && !isCashCollected}>
          <Icon name="arrow-right" size={20} color="#6B7280" />
          <Text style={styles.deliverButtonText}>Order delivered</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
    paddingBottom: 16,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: Fonts.SemiBold,
    color: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  preferenceBanner: {
    backgroundColor: BLUE_COLOR,
    marginTop: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  preferenceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  preferenceText: {
    color: 'white',
    fontSize: 14,
    fontFamily: Fonts.Medium,
    marginLeft: 8,
  },
  viewButton: {
    backgroundColor: '#1d4ed8',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  viewButtonText: {
    color: 'white',
    fontSize: 12,
    fontFamily: Fonts.SemiBold,
  },
  paymentSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  paymentMethod: {
    marginBottom: 16,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentTitle: {
    fontSize: 16,
    fontFamily: Fonts.SemiBold,
    color: '#111827',
    marginLeft: 8,
  },
  paymentSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  upiBranding: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  bhimText: {
    fontSize: 18,
    fontFamily: Fonts.Bold,
    color: '#000',
    marginRight: 8,
  },
  upiText: {
    fontSize: 16,
    fontFamily: Fonts.SemiBold,
    color: '#000',
    marginLeft: 8,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityText: {
    fontSize: 12,
    color: '#10b981',
    fontFamily: Fonts.Medium,
    marginLeft: 4,
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  separatorText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#6B7280',
    fontFamily: Fonts.Medium,
  },
  orderIdText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  checkboxContainer: {
    alignSelf: 'flex-end',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: PRIMARY_GREEN,
    borderColor: PRIMARY_GREEN,
  },
  customerSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  customerHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerHeaderTitle: {
    fontSize: 16,
    fontFamily: Fonts.SemiBold,
    color: '#111827',
    marginLeft: 8,
  },
  customerInfo: {
    marginTop: 8,
  },
  customerName: {
    fontSize: 16,
    fontFamily: Fonts.SemiBold,
    color: '#111827',
    marginBottom: 4,
  },
  customerAddress: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  bottomContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  deliverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  deliverButtonDisabled: {
    opacity: 0.5,
  },
  deliverButtonText: {
    fontSize: 16,
    fontFamily: Fonts.SemiBold,
    color: '#6B7280',
  },
});

export default DropOrderScreen;
