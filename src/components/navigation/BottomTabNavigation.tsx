import React from 'react';
import {View, StyleSheet, TouchableOpacity, Platform} from 'react-native';
import {Colors, Fonts} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {RFValue} from 'react-native-responsive-fontsize';

interface TabItem {
  id: string;
  label: string;
  icon: string;
  activeIcon?: string;
}

interface BottomTabNavigationProps {
  activeTab: string;
  onTabPress: (tabId: string) => void;
}

const BottomTabNavigation: React.FC<BottomTabNavigationProps> = ({
  activeTab,
  onTabPress,
}) => {
  const tabs: TabItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: 'home-outline',
      activeIcon: 'home',
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: 'truck-delivery-outline',
      activeIcon: 'truck-delivery',
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: 'account-outline',
      activeIcon: 'account',
    },
  ];

  const renderTab = (tab: TabItem) => {
    const isActive = activeTab === tab.id;
    const iconName = isActive ? tab.activeIcon || tab.icon : tab.icon;
    const iconColor = isActive ? Colors.secondary : Colors.disabled;
    const textColor = isActive ? Colors.secondary : Colors.disabled;

    return (
      <TouchableOpacity
        key={tab.id}
        style={styles.tab}
        onPress={() => onTabPress(tab.id)}
        activeOpacity={0.7}>
        <View style={styles.tabContent}>
          <Icon name={iconName} size={RFValue(24)} color={iconColor} />
          <CustomText
            variant="h9"
            fontFamily={Fonts.Medium}
            style={[styles.tabLabel, {color: textColor}]}>
            {tab.label}
          </CustomText>
          {isActive && <View style={styles.activeIndicator} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>{tabs.map(renderTab)}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    paddingTop: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 6,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  tabContent: {
    alignItems: 'center',
    position: 'relative',
  },
  tabLabel: {
    fontSize: RFValue(11),
    marginTop: 3,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -6,
    width: 18,
    height: 2,
    backgroundColor: Colors.secondary,
    borderRadius: 1,
  },
});

export default BottomTabNavigation;
