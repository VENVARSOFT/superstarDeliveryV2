import {View, StyleSheet} from 'react-native';
import React, {FC} from 'react';
import {adData} from '@utils/dummyData';
import AdCarousal from './AdCarousal';
import {Fonts} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import CategoryContainer from './CategoryContainer';
import MostPopular from './MostPopular';

const Content: FC = () => {
  return (
    <View style={styles.container}>
      <AdCarousal adData={adData} />
      <CustomText variant="h8" fontFamily={Fonts.SemiBold}>
        Categories
      </CustomText>
      <CategoryContainer />
      <CustomText variant="h8" fontFamily={Fonts.SemiBold}>
        Most Popular Products
      </CustomText>
      <MostPopular />
      {/* <CustomText variant='h5' fontFamily={Fonts.SemiBold}>Snacks & Drinks</CustomText>
      <CategoryContainer data={categories} />
      <CustomText variant='h5' fontFamily={Fonts.SemiBold}>Home & Lifestyle</CustomText>
      <CategoryContainer data={categories} /> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 0,
  },
});

export default Content;
