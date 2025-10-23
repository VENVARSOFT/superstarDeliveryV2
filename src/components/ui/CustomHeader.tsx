import {View, Text, SafeAreaView, StyleSheet, Pressable} from 'react-native';
import React, {FC} from 'react';
import {Colors, Fonts} from '@utils/Constants';
import Icon from 'react-native-vector-icons/Ionicons';
import {goBack, navigationRef} from '@utils/NavigationUtils';
import {RFValue} from 'react-native-responsive-fontsize';
import CustomText from './CustomText';

const CustomHeader: FC<{
  title: string;
  search?: boolean;
  showBackButton?: boolean;
}> = ({title, search, showBackButton = true}) => {
  const canGoBack = navigationRef.isReady() && navigationRef.canGoBack();
  const shouldShowBackButton = showBackButton && canGoBack;

  return (
    <SafeAreaView>
      <View style={styles.flexRow}>
        {shouldShowBackButton ? (
          <Pressable onPress={() => goBack()}>
            <Icon name="chevron-back" color={Colors.text} size={RFValue(16)} />
          </Pressable>
        ) : (
          <View style={styles.placeholder} />
        )}
        <CustomText
          style={styles.text}
          variant="h5"
          fontFamily={Fonts.SemiBold}>
          {title}
        </CustomText>

        <View>
          {search && (
            <Icon name="search" color={Colors.text} size={RFValue(16)} />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flexRow: {
    justifyContent: 'space-between',
    padding: 10,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderBottomWidth: 0.6,
    borderColor: Colors.border,
  },
  text: {
    textAlign: 'center',
  },
  placeholder: {
    width: RFValue(16),
    height: RFValue(16),
  },
});

export default CustomHeader;
