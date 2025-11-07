import {
  View,
  StyleSheet,
  SafeAreaView,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {Colors, Fonts} from '@utils/Constants';
import {useAuthStore} from '@state/authStore';
import StatsCards from '@components/delivery/StatsCards';
import TabBar from '@components/delivery/TabBar';
import Geolocation from '@react-native-community/geolocation';
import {reverseGeocode} from '@service/mapService';
import DeliveryOrderItem from '@components/delivery/DeliveryOrderItem';
import CustomText from '@components/ui/CustomText';
import withLiveOrder from './withLiveOrder';
import {
  mockAvailableOrders,
  mockDeliveredOrders,
  mockUser as mockUserData,
} from '@utils/Data';
import DeliveryHeader from '@components/delivery/DeliveryHeader';
import {getDeliveryAgentOrders} from '@service/orderService';

const DeliveryDashboard = () => {
  const {user, setUser} = useAuthStore();
  const [selectedTab, setSelectedTab] = useState<'available' | 'delivered'>(
    'available',
  );
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    setData([]);
    setRefreshing(true);
    setLoading(true);
    setError(null);

    try {
      if (!user?.idUser) {
        // Fallback to mock data if no user ID
        let mockData: any[] = [];
        if (selectedTab === 'available') {
          mockData = mockAvailableOrders;
        } else if (selectedTab === 'delivered') {
          mockData = mockDeliveredOrders;
        }
        setData(mockData);
        setRefreshing(false);
        setLoading(false);
        return;
      }

      const response = await getDeliveryAgentOrders(user.idUser);

      if (response?.success && response.data) {
        // Filter orders based on selected tab
        let filteredOrders = response.data;
        if (selectedTab === 'available') {
          // Show orders that are assigned but not delivered
          filteredOrders = response.data.filter(
            order =>
              order.status === 'ASSIGNED' || order.status === 'CONFIRMED',
          );
        } else if (selectedTab === 'delivered') {
          // Show delivered orders
          filteredOrders = response.data.filter(
            order =>
              order.status === 'DELIVERED' || order.status === 'COMPLETED',
          );
        }
        setData(filteredOrders);
      } else {
        // Fallback to mock data if API fails
        let mockData: any[] = [];
        if (selectedTab === 'available') {
          mockData = mockAvailableOrders;
        } else if (selectedTab === 'delivered') {
          mockData = mockDeliveredOrders;
        }
        setData(mockData);
        setError('Failed to fetch orders, showing sample data');
      }
    } catch (err) {
      console.error('Error fetching delivery agent orders:', err);
      // Fallback to mock data on error
      let mockData: any[] = [];
      if (selectedTab === 'available') {
        mockData = mockAvailableOrders;
      } else if (selectedTab === 'delivered') {
        mockData = mockDeliveredOrders;
      }
      setData(mockData);
      setError('Error loading orders, showing sample data');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [selectedTab, user?.idUser]);

  const updateUser = React.useCallback(() => {
    // Use mock user data if no user is set
    if (!user) {
      setUser(mockUserData);
    }

    Geolocation.getCurrentPosition(
      position => {
        const {latitude, longitude} = position.coords;
        reverseGeocode(latitude, longitude, setUser);
      },
      _err => {
        // Fallback to mock user data if geolocation fails
        if (!user) {
          setUser(mockUserData);
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 15000,
      },
    );
  }, [user, setUser]);

  useEffect(() => {
    updateUser();
  }, [updateUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const renderOrderItem = React.useCallback(({item, index}: any) => {
    return <DeliveryOrderItem index={index} item={item} />;
  }, []);

  const renderEmptyComponent = React.useCallback(() => {
    if (loading && !refreshing) {
      return (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.secondary} size="small" />
        </View>
      );
    }
    return (
      <View style={styles.center}>
        <CustomText>No Orders found yet!</CustomText>
        {error && <CustomText style={styles.errorText}>{error}</CustomText>}
      </View>
    );
  }, [loading, refreshing, error]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <DeliveryHeader
          name={user ? `${user.nmFirst || ''} ${user.nmLast || ''}`.trim() : ''}
          email={user?.idEmail || ''}
        />

        {/* Statistics Cards */}
        <StatsCards />
        {/* Delivery Status Section */}
        {/* <DeliveryStatusSection /> */}
      </SafeAreaView>
      {/* Main Content Area */}
      <View style={styles.subContainer}>
        <TabBar selectedTab={selectedTab} onTabChange={setSelectedTab} />

        <FlatList
          data={data}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => await fetchData()}
            />
          }
          ListEmptyComponent={renderEmptyComponent}
          renderItem={renderOrderItem}
          keyExtractor={item => item.idOrder?.toString() || item.orderId}
          contentContainerStyle={styles.flatlistContaienr}
        />
      </View>

      {/* Bottom Tab Navigation */}
      {/* <BottomTabNavigation
        activeTab={activeBottomTab}
        onTabPress={handleBottomTabPress}
      /> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.backgroundSecondary,
    flex: 1,
  },
  safeArea: {
    backgroundColor: Colors.secondary,
  },
  subContainer: {
    backgroundColor: Colors.backgroundSecondary,
    flex: 1,
    padding: 4,
  },
  flatlistContaienr: {
    padding: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  statusContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusConnected: {
    backgroundColor: '#10B981', // Green
  },
  statusConnecting: {
    backgroundColor: '#F59E0B', // Amber/Orange
  },
  statusDisconnected: {
    backgroundColor: '#EF4444', // Red
  },
  statusIcon: {
    marginRight: 2,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontFamily: Fonts.Medium,
  },
});

export default withLiveOrder(DeliveryDashboard);
