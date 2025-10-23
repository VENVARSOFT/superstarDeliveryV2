import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import React, {FC} from 'react';
import {Colors, Fonts} from '@utils/Constants';
import {RFValue} from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomText from '@components/ui/CustomText';

interface ActionButtonProps {
  icon: string;
  label: string;
  onPress?: () => void;
}

const ActionButton: FC<ActionButtonProps> = ({icon, label, onPress}) => {
  return (
    <TouchableOpacity style={styles.btn} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Icon name={icon} color={Colors.text} size={RFValue(16)} />
      </View>
      <CustomText
        variant="h8"
        fontFamily={Fonts.Medium}
        style={styles.labelText}>
        {label}
      </CustomText>
      <Icon
        name="chevron-forward"
        color={Colors.text}
        size={RFValue(10)}
        style={styles.chevron}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginVertical: 2,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
    height: 24,
    marginRight: 12,
  },
  labelText: {
    flex: 1,
    color: '#000',
  },
  chevron: {
    marginLeft: 8,
  },
});

export default ActionButton;
