import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Colors, Fonts} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {RFValue} from 'react-native-responsive-fontsize';

interface StatCardProps {
  icon: string;
  value: string;
  label: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({icon, value, label, color}) => {
  return (
    <View style={styles.card}>
      <View style={styles.contentContainer}>
        <Icon name={icon} size={RFValue(16)} color={color} />
        <View style={styles.textContainer}>
          <CustomText
            variant="h9"
            fontFamily={Fonts.Bold}
            style={[styles.valueText, {color}]}
            numberOfLines={1}>
            {value}
          </CustomText>
          <CustomText
            variant="h10"
            fontFamily={Fonts.Medium}
            style={styles.labelText}
            numberOfLines={1}>
            {label}
          </CustomText>
        </View>
      </View>
    </View>
  );
};

const StatsCards: React.FC = () => {
  const statsData = [
    {
      icon: 'currency-inr',
      value: '156.5',
      label: 'Today Earnings',
      color: '#4CAF50',
    },
    {
      icon: 'check-circle-outline',
      value: '12',
      label: 'Total Orders',
      color: '#2196F3',
    },
    {
      icon: 'star-outline',
      value: '4.8',
      label: 'Rating',
      color: '#FF9800',
    },
    // {
    //   icon: 'target',
    //   value: '95%',
    //   label: 'Success',
    //   color: '#9C27B0',
    // },
  ];

  return (
    <View style={styles.container}>
      {statsData.map((stat, index) => (
        <StatCard
          key={index}
          icon={stat.icon}
          value={stat.value}
          label={stat.label}
          color={stat.color}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingVertical: 8,
    backgroundColor: Colors.primary,
    gap: 4,
  },
  card: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minHeight: 50,
    maxHeight: 60,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  valueText: {
    lineHeight: 16,
  },
  labelText: {
    color: Colors.disabled,
    lineHeight: 14,
    marginTop: 1,
  },
});

export default StatsCards;
