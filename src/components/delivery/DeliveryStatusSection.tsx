import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Colors, Fonts} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {RFValue} from 'react-native-responsive-fontsize';

const DeliveryStatusSection: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="truck-delivery" size={RFValue(20)} color="#4CAF50" />
        <CustomText
          variant="h8"
          fontFamily={Fonts.SemiBold}
          style={styles.title}>
          Delivery Status
        </CustomText>
      </View>

      <View style={styles.content}>
        <CustomText
          variant="h10"
          fontFamily={Fonts.Medium}
          style={styles.message}>
          No orders available right now.
        </CustomText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 10,
    // marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    color: Colors.text,
    marginLeft: 6,
  },
  content: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  message: {
    color: Colors.disabled,
    textAlign: 'center',
  },
});

export default DeliveryStatusSection;
