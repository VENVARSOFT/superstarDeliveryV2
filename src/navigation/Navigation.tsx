import React, {FC} from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {NavigationContainer} from '@react-navigation/native';
import {navigationRef} from '@utils/NavigationUtils';
import SplashScreen from '@features/auth/SplashScreen';
import CustomerLogin from '@features/auth/CustomerLogin';
import DeliveryLogin from '@features/auth/DeliveryLogin';
import Otp from '@features/auth/Otp';
import DeliveryDashboard from '@features/delivery/DeliveryDashboard';
import DeliveryProfile from '@features/delivery/DeliveryProfile';

import DeliveryOrders from '@features/delivery/DeliveryOrders';
import DeliveryHistory from '@features/delivery/DeliveryHistory';
import AcceptOrderScreen from '@features/delivery/AcceptOrderScreen';
import PickupNavigationScreen from '@features/delivery/PickupNavigationScreen';
import OrderDetailsScreen from '@features/delivery/OrderDetailsScreen';
import DropOrderScreen from '@features/delivery/DropOrderScreen';
import Earnings from '@features/delivery/Earnings';
import VehicleDetails from '@features/delivery/VehicleDetails';
import Profile from '@features/profile/Profile';
import ConfirmLocation from '@features/map/ConfirmLocation';
import OrderAssignmentScreen from '@features/orders/OrderAssignmentScreen';

const Stack = createNativeStackNavigator();

const Navigation: FC = () => {
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="SplashScreen"
        screenOptions={{
          headerShown: false,
        }}>
        <Stack.Screen
          options={{
            animation: 'fade',
          }}
          name="CustomerLogin"
          component={CustomerLogin}
        />
        <Stack.Screen
          options={{
            animation: 'fade',
          }}
          name="DeliveryLogin"
          component={DeliveryLogin}
        />
        <Stack.Screen
          options={{
            animation: 'fade',
          }}
          name="Otp"
          component={Otp}
        />
        <Stack.Screen name="SplashScreen" component={SplashScreen} />
        <Stack.Screen name="DeliveryDashboard" component={DeliveryDashboard} />
        <Stack.Screen name="DeliveryProfile" component={DeliveryProfile} />

        <Stack.Screen name="DeliveryOrders" component={DeliveryOrders} />
        <Stack.Screen name="DeliveryHistory" component={DeliveryHistory} />
        <Stack.Screen name="AcceptOrder" component={AcceptOrderScreen} />
        <Stack.Screen
          name="PickupNavigation"
          component={PickupNavigationScreen}
          options={{
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="OrderDetails"
          component={OrderDetailsScreen}
          options={{
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="DropOrder"
          component={DropOrderScreen}
          options={{
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen name="Earnings" component={Earnings} />
        <Stack.Screen name="VehicleDetails" component={VehicleDetails} />
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="ConfirmLocation" component={ConfirmLocation} />
        <Stack.Screen
          name="OrderAssignment"
          component={OrderAssignmentScreen}
          options={{
            animation: 'slide_from_bottom',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
