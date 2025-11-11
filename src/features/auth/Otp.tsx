import React, {useEffect, useRef, useState} from 'react';
import {
  Animated,
  Image,
  Keyboard,
  Platform,
  SafeAreaView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import CustomSafeAreaView from '@components/global/CustomSafeAreaView';
import {Colors, Fonts, lightColors} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import {RFValue} from 'react-native-responsive-fontsize';
import useKeyboardOffsetHeight from '@utils/useKeyboardOffsetHeight';
import LinearGradient from 'react-native-linear-gradient';
import CustomButton from '@components/ui/CustomButton';
import {goBack, resetAndNavigate} from '@utils/NavigationUtils';
import {useRoute} from '@react-navigation/native';
import ProductSlider from '@components/login/ProductSlider';
import {verifyOTP} from '@service/authService';
import {useAuthStore} from '@state/authStore';
import {USER_TYPE} from '@service/config';
import {ImageUtils} from '@utils/ImageUtils';

const bottomColors = [...lightColors].reverse();

const Otp = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const keyboardOffsetHeight = useKeyboardOffsetHeight();
  const route = useRoute<any>();
  const phone = route?.params?.phone as string | undefined;

  const hiddenInputRef = useRef<TextInput>(null);
  const {setUser, setTokens} = useAuthStore();

  useEffect(() => {
    if (keyboardOffsetHeight === 0) {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(animatedValue, {
        toValue: Math.round(-keyboardOffsetHeight * 0.84),
        duration: 1000,
        useNativeDriver: true,
      }).start();
    }
  }, [keyboardOffsetHeight, animatedValue]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      return;
    }

    if (!phone) {
      return;
    }

    setLoading(true);
    try {
      const response = await verifyOTP(phone, otp, USER_TYPE);

      if (response.success && response.data) {
        const {user, token, refreshToken, tokenExpiry} = response.data;
        // Update Redux store
        setUser(user);
        setTokens({
          token,
          refreshToken,
          tokenExpiry,
        });
        // Navigate to dashboard
        resetAndNavigate('Home');
      } else {
        throw new Error(response.error || 'OTP verification failed');
      }
    } catch (error: any) {
      console.error('OTP Verification Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <CustomSafeAreaView>
        <ProductSlider />
        <Animated.ScrollView
          bounces={false}
          style={{transform: [{translateY: animatedValue}]}}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.subContainer}>
          <LinearGradient colors={bottomColors} style={styles.gradient} />

          <View style={styles.content}>
            <Image
              source={ImageUtils.getLogo('main')}
              style={[ImageUtils.styles.smallLogo, styles.logo]}
            />

            <CustomText variant="h5" fontFamily={Fonts.Bold}>
              Verify OTP
            </CustomText>
            <CustomText
              variant="h6"
              fontFamily={Fonts.SemiBold}
              style={styles.text}>
              {phone
                ? `Enter the 6-digit code sent to +91 ${phone}`
                : 'Enter the 6-digit code sent to your number'}
            </CustomText>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => hiddenInputRef.current?.focus()}
              style={styles.otpContainer}>
              {Array.from({length: 6}).map((_, idx) => {
                const char = otp[idx] ?? '';
                const isActive = otp.length === idx;
                return (
                  <View
                    key={`otp-${idx}`}
                    style={[styles.otpBox, isActive && styles.otpBoxActive]}>
                    <CustomText variant="h3" fontFamily={Fonts.Bold}>
                      {char}
                    </CustomText>
                  </View>
                );
              })}
            </TouchableOpacity>

            <TextInput
              ref={hiddenInputRef}
              value={otp}
              onChangeText={text => setOtp(text.replace(/\D/g, '').slice(0, 6))}
              keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
              inputMode="numeric"
              maxLength={6}
              style={styles.hiddenInput}
              autoFocus
              onSubmitEditing={() => {
                if (otp.length === 6) {
                  handleVerify();
                }
              }}
              blurOnSubmit={false}
              returnKeyType="done"
            />

            <CustomButton
              title="Verify"
              onPress={handleVerify}
              loading={loading}
              disabled={otp.length !== 6}
            />
          </View>
        </Animated.ScrollView>

        <View style={styles.footer}>
          <SafeAreaView />
          <CustomText fontSize={RFValue(6)}>
            By Continuing, you agree to our Terms of Service & Privacy Policy
          </CustomText>
          <SafeAreaView />
        </View>
      </CustomSafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  text: {
    marginTop: 6,
    marginBottom: 25,
    opacity: 0.8,
    textAlign: 'center',
  },
  logo: {
    height: 50,
    width: 50,
    borderRadius: 20,
    marginVertical: 10,
  },
  subContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 20,
  },
  gradient: {
    paddingTop: 60,
    width: '100%',
  },
  content: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  otpBox: {
    height: 52,
    width: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  otpBoxActive: {
    borderColor: '#F8890E',
    borderWidth: 1.2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  backButton: {
    marginTop: 10,
    alignSelf: 'stretch',
  },
  backButtonWrapper: {
    marginTop: 10,
    alignSelf: 'stretch',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
  },
  footer: {
    borderTopWidth: 0.8,
    borderColor: Colors.border,
    paddingBottom: 10,
    zIndex: 22,
    position: 'absolute',
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f8f9fc',
    width: '100%',
  },
});

export default Otp;
