import React, {useState, useEffect} from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import {Colors, Fonts} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import {RFValue} from 'react-native-responsive-fontsize';

interface ModernHeaderProps {
  userName?: string;
}

const ModernHeader: React.FC<ModernHeaderProps> = ({userName: _userName}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const toggleOnlineStatus = () => {
    setIsOnline(!isOnline);
  };

  return (
    <View style={styles.container}>
      {/* Left side - Greeting and Date */}
      <View style={styles.leftSection}>
        <View style={styles.greetingContainer}>
          <CustomText
            variant="h3"
            fontFamily={Fonts.Bold}
            style={styles.greetingText}>
            Hi there! 👋
          </CustomText>
        </View>
        <CustomText
          variant="h8"
          fontFamily={Fonts.Medium}
          style={styles.dateText}>
          {formatDate(currentTime)}
        </CustomText>
      </View>

      {/* Right side - Time and Status */}
      <View style={styles.rightSection}>
        <CustomText
          variant="h7"
          fontFamily={Fonts.SemiBold}
          style={styles.timeText}>
          {formatTime(currentTime)}
        </CustomText>

        <View style={styles.statusContainer}>
          <View style={styles.statusIndicator}>
            <View
              style={[
                styles.statusDot,
                {backgroundColor: isOnline ? '#4CAF50' : '#F44336'},
              ]}
            />
            <CustomText
              variant="h9"
              fontFamily={Fonts.Medium}
              style={styles.statusText}>
              {isOnline ? 'Online' : 'Offline'}
            </CustomText>
          </View>

          <View style={styles.separator} />

          <TouchableOpacity
            onPress={toggleOnlineStatus}
            style={styles.statusButton}
            activeOpacity={0.7}>
            <CustomText
              variant="h9"
              fontFamily={Fonts.SemiBold}
              style={styles.statusButtonText}>
              {isOnline ? 'Go Offline' : 'Go Online'}
            </CustomText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
  },
  leftSection: {
    flex: 1,
  },
  greetingContainer: {
    marginBottom: 2,
  },
  greetingText: {
    color: Colors.text_secondary,
    fontSize: RFValue(22),
  },
  dateText: {
    color: Colors.text_secondary,
    opacity: 0.8,
    fontSize: RFValue(13),
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  timeText: {
    color: Colors.text_secondary,
    fontSize: RFValue(15),
    marginBottom: 6,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    color: Colors.text_secondary,
    fontSize: RFValue(11),
  },
  separator: {
    width: 1,
    height: 14,
    backgroundColor: Colors.text_secondary,
    opacity: 0.3,
    marginHorizontal: 6,
  },
  statusButton: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusButtonText: {
    color: Colors.text_secondary,
    fontSize: RFValue(10),
  },
});

export default ModernHeader;
