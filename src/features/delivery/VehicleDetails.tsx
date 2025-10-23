import React from 'react';
import {View, StyleSheet} from 'react-native';
import CustomHeader from '@components/ui/CustomHeader';
import CustomText from '@components/ui/CustomText';
import {Fonts, Colors} from '@utils/Constants';

const VehicleDetails = () => {
  return (
    <View style={styles.container}>
      <CustomHeader title="Vehicle Details" />
      <View style={styles.content}>
        <CustomText
          variant="h6"
          fontFamily={Fonts.SemiBold}
          style={styles.title}>
          Vehicle Details
        </CustomText>
        <CustomText
          variant="h8"
          fontFamily={Fonts.Regular}
          style={styles.subtitle}>
          Your vehicle information and documents will appear here.
        </CustomText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    color: Colors.text,
    marginBottom: 10,
  },
  subtitle: {
    color: Colors.text,
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default VehicleDetails;

