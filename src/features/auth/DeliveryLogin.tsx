import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import CustomText from '@components/ui/CustomText';
import CustomInput from '@components/ui/CustomInput';
import CustomButton from '@components/ui/CustomButton';
import {Fonts, Colors} from '@utils/Constants';
import {RFValue} from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {navigate} from '@utils/NavigationUtils';

const DeliveryLogin = () => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone.trim()) {
      return;
    }

    if (phone.length < 10) {
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement delivery partner login logic
      // For now, navigate to OTP screen
      navigate('Otp', {phone, userType: 'delivery'});
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Icon
              name="truck-delivery"
              size={RFValue(60)}
              color={Colors.primary}
            />
          </View>
          <CustomText variant="h4" fontFamily={Fonts.Bold} style={styles.title}>
            Delivery Partner
          </CustomText>
          <CustomText
            variant="h7"
            fontFamily={Fonts.Regular}
            style={styles.subtitle}>
            Sign in to start delivering
          </CustomText>
        </View>

        <View style={styles.form}>
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
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
            right
            onClear={() => setPhone('')}
          />

          <CustomButton
            title={loading ? 'Signing in...' : 'Sign In'}
            onPress={handleLogin}
            disabled={loading}
            loading={loading}
          />
        </View>

        <View style={styles.footer}>
          <CustomText
            variant="h8"
            fontFamily={Fonts.Regular}
            style={styles.footerText}>
            Don't have an account?{' '}
            <CustomText
              variant="h8"
              fontFamily={Fonts.SemiBold}
              style={styles.linkText}>
              Contact Support
            </CustomText>
          </CustomText>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    color: Colors.text,
    opacity: 0.7,
    textAlign: 'center',
  },
  form: {
    marginBottom: 30,
  },
  leftIconWrap: {
    width: 40,
    paddingLeft: 6,
    borderRightWidth: 0.5,
    borderRightColor: Colors.border,
    alignItems: 'center',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: Colors.text,
    opacity: 0.7,
  },
  linkText: {
    color: Colors.primary,
  },
});

export default DeliveryLogin;

