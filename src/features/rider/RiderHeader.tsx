import {
  StyleSheet,
  View,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import React, {useEffect, useState, useCallback} from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import Geolocation from '@react-native-community/geolocation';
import {useWS} from '@service/WsProvider';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {RFValue} from 'react-native-responsive-fontsize';
import CustomText from '@components/ui/CustomText';
import {Fonts} from '@utils/Constants';

interface LocationState {
  latitude: number;
  longitude: number;
  address: string;
  heading: number | null;
}

interface RiderHeaderProps {
  onDuty: boolean;
  setOnDuty: (value: boolean) => void;
}

const RiderHeader = ({onDuty, setOnDuty}: RiderHeaderProps) => {
  const {emit} = useWS();
  const [_location, setLocation] = useState<LocationState | null>(null);
  const [isFocused, _setIsFocused] = useState(false);
  const [todaysEarnings, _setTodaysEarnings] = useState(50031.22);

  // Animation values
  const toggleAnim = useSharedValue(0);

  // Update animation when onDuty changes
  useEffect(() => {
    toggleAnim.value = withSpring(onDuty ? 1 : 0, {
      damping: 15,
      stiffness: 150,
    });
  }, [onDuty, toggleAnim]);

  const toggleOnDuty = useCallback(async () => {
    if (!onDuty) {
      // Request location permission
      Geolocation.requestAuthorization();

      // Get current position
      Geolocation.getCurrentPosition(
        position => {
          const {latitude, longitude, heading} = position.coords;

          // Set local location state
          setLocation({
            latitude,
            longitude,
            address: 'Somewhere',
            heading: heading as number,
          });

          // Emit 'goOnDuty' event
          emit('goOnDuty', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            heading: heading as number,
          });

          setOnDuty(true);
        },
        error => {
          if (error.code === 1) {
            // Permission denied
            Alert.alert(
              'Permission Denied',
              'Location permission is required to go on duty.',
            );
          } else {
            Alert.alert(
              'Location Error',
              'Unable to get your current location. Please try again.',
            );
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 1000,
        },
      );
    } else {
      // Emit 'goOffDuty' event
      emit('goOffDuty', {});
      setOnDuty(false);
    }
  }, [onDuty, emit, setOnDuty]);

  // Animated styles
  const animatedToggleStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      toggleAnim.value,
      [0, 1],
      ['#E0E0E0', '#4CAF50'], // Gray to Green
    );
    return {
      backgroundColor,
    };
  });

  const animatedThumbStyle = useAnimatedStyle(() => {
    // Slide distance: from right:4 to left: 140 - 28 - 4 = 108px to the left
    const translateX = toggleAnim.value * -108; // Negative to move left
    return {
      transform: [{translateX}],
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      toggleAnim.value,
      [0, 1],
      ['#9E9E9E', '#FFFFFF'], // Gray to White
    );
    // Smoothly interpolate margins
    const marginLeft = toggleAnim.value === 0 ? 8 : 0;
    const marginRight = toggleAnim.value === 1 ? 8 : 0;
    return {
      color,
      marginLeft,
      marginRight,
    };
  });

  useEffect(() => {
    if (isFocused) {
      toggleOnDuty();
    }
  }, [isFocused, toggleOnDuty]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFEB3B" />
      <SafeAreaView style={styles.safeArea}>
        {/* Main Header Bar */}
        <View style={styles.headerBar}>
          {/* Power Button */}
          <TouchableOpacity style={styles.iconButton}>
            <Icon name="power" size={RFValue(24)} color="#000" />
          </TouchableOpacity>

          {/* Toggle Switch */}
          <TouchableOpacity
            onPress={toggleOnDuty}
            activeOpacity={0.8}
            style={styles.toggleContainer}>
            <Animated.View style={[styles.toggleSwitch, animatedToggleStyle]}>
              <Animated.View style={[styles.toggleThumb, animatedThumbStyle]} />
              <Animated.Text style={[styles.toggleText, animatedTextStyle]}>
                {onDuty ? 'ON-DUTY' : 'OFF-DUTY'}
              </Animated.Text>
            </Animated.View>
          </TouchableOpacity>

          {/* Bell Icon */}
          <TouchableOpacity style={styles.iconButton}>
            <Icon name="bell-outline" size={RFValue(24)} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Earnings Bar */}
        <View style={styles.earningsBar}>
          <CustomText
            variant="h5"
            fontFamily={Fonts.Medium}
            style={styles.earningsLabel}>
            Today's Earnings
          </CustomText>
          <TouchableOpacity style={styles.earningsAmountContainer}>
            <CustomText
              variant="h4"
              fontFamily={Fonts.SemiBold}
              style={styles.earningsAmount}>
              ₹
              {todaysEarnings.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
              })}
            </CustomText>
            <Icon
              name="chevron-down"
              size={RFValue(16)}
              color="#fff"
              style={styles.dropdownIcon}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default RiderHeader;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFEB3B', // Yellow background
  },
  safeArea: {
    backgroundColor: '#FFEB3B',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFEB3B',
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  powerIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  powerCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#000',
    backgroundColor: 'transparent',
  },
  powerLine: {
    width: 2,
    height: 8,
    backgroundColor: '#000',
    position: 'absolute',
    top: 2,
    left: 9,
  },
  toggleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  toggleSwitch: {
    width: 140,
    height: 36,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  toggleThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    position: 'absolute',
    right: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  toggleText: {
    fontSize: RFValue(11),
    fontWeight: '600',
    zIndex: 1,
  },
  earningsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#424242',
  },
  earningsLabel: {
    color: '#fff',
    fontSize: RFValue(14),
  },
  earningsAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  earningsAmount: {
    color: '#fff',
    fontSize: RFValue(16),
    marginRight: 4,
  },
  dropdownIcon: {
    marginLeft: 4,
  },
});
