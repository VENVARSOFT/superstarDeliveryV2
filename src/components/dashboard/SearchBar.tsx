import {View, StyleSheet, TouchableOpacity} from 'react-native';
import React, {FC} from 'react';
import {Colors, Fonts} from '@utils/Constants';
import Icon from 'react-native-vector-icons/Ionicons';
import {RFValue} from 'react-native-responsive-fontsize';
import RollingBar from 'react-native-rolling-bar';
import CustomText from '@components/ui/CustomText';
import {navigate} from '@utils/NavigationUtils';

const SearchBar: FC = () => {
  const handleSearchPress = () => {
    navigate('SearchScreen');
  };

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.8}
      onPress={handleSearchPress}>
      <Icon name="search" color={Colors.text} size={RFValue(20)} />
      <RollingBar
        interval={3000}
        defaultStyle={false}
        customStyle={styles.textContainer}>
        <CustomText variant="h6" fontFamily={Fonts.Medium}>
          Search "Goli soda"
        </CustomText>
        <CustomText variant="h6" fontFamily={Fonts.Medium}>
          Search "Tea"
        </CustomText>
        <CustomText variant="h6" fontFamily={Fonts.Medium}>
          Search for Sugar can
        </CustomText>
        <CustomText variant="h6" fontFamily={Fonts.Medium}>
          Search "Juice"
        </CustomText>
        <CustomText variant="h6" fontFamily={Fonts.Medium}>
          Search "Coffee"
        </CustomText>
      </RollingBar>

      <View style={styles.divider} />

      <Icon name="mic" color={Colors.text} size={RFValue(20)} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F3F4F7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    borderWidth: 0.6,
    borderColor: Colors.border,
    marginTop: 0,
    marginBottom: 0,
    overflow: 'hidden',
    marginHorizontal: 10,
    paddingHorizontal: 10,
  },
  textContainer: {
    width: '90%',
    paddingLeft: 10,
    height: 50,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#ddd',
    marginHorizontal: 10,
  },
});

export default SearchBar;
