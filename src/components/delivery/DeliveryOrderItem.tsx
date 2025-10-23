import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import React, {FC} from 'react';
import {RFValue} from 'react-native-responsive-fontsize';
import {Colors, Fonts} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import {formatISOToCustom} from '@utils/DateUtils';
import {navigate} from '@utils/NavigationUtils';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface CartItem {
  _id: string | number;
  item: any;
  count: number;
}

interface Order {
  orderId?: string;
  txOrderNumber?: string;
  idOrder?: number;
  items?: CartItem[];
  orderItems?: Array<{
    idOrderItem: number;
    idOrder: number;
    idProduct: number;
    txProductName: string;
    nbQuantity: number;
    nbPrice: number;
    nbSubtotal: number;
    productDescription?: string;
    productImageUrl?: string;
  }>;
  deliveryLocation?: any;
  txFormattedAddress?: string;
  totalPrice?: number;
  nbTotalAmount?: number;
  createdAt?: string;
  dtCreated?: string;
  status:
    | 'ASSIGNED'
    | 'CONFIRMED'
    | 'DELIVERED'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'confirmed'
    | 'completed';
}

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'available':
    case 'assigned':
      return '#28a745';
    case 'confirmed':
      return '#007bff';
    case 'delivered':
    case 'completed':
      return '#17a2b8';
    case 'cancelled':
      return '#dc3545';
    default:
      return '#6c757d';
  }
}

const DeliveryOrderItem: FC<{item: Order; index: number}> = ({item, index}) => {
  // Handle both old and new data structures
  const orderId = item.txOrderNumber || item.orderId;
  const orderItems = item.orderItems || item.items || [];
  const totalAmount = item.nbTotalAmount || item.totalPrice || 0;
  const address =
    item.txFormattedAddress ||
    item?.deliveryLocation?.address ||
    'Address not available';
  const createdAt = item.dtCreated || item.createdAt;

  // Convert orderItems to display format if needed
  const displayItems = orderItems.map((orderItem: any) => {
    if (orderItem.txProductName) {
      // New API format
      return {
        count: orderItem.nbQuantity,
        item: {name: orderItem.txProductName},
      };
    } else {
      // Old format
      return orderItem;
    }
  });

  return (
    <View style={styles.container}>
      <View style={styles.flexRowBetween}>
        <CustomText variant="h8" fontFamily={Fonts.Medium}>
          #{orderId}
        </CustomText>

        <View style={[styles.statusContainer]}>
          <CustomText
            variant="h8"
            fontFamily={Fonts.SemiBold}
            style={[styles.statusText, {color: getStatusColor(item.status)}]}>
            {item.status}
          </CustomText>
        </View>
      </View>

      <View style={styles.itemsContainer}>
        {displayItems.slice(0, 2).map((i: any, idx: number) => {
          return (
            <CustomText variant="h8" numberOfLines={1} key={idx}>
              {i.count}x {i.item.name}
            </CustomText>
          );
        })}
        {displayItems.length > 2 && (
          <CustomText variant="h8" style={styles.moreItemsText}>
            +{displayItems.length - 2} more items
          </CustomText>
        )}
      </View>

      <View style={[styles.flexRowBetween, styles.addressContainer]}>
        <View style={styles.addressTextContainer}>
          <CustomText variant="h8" numberOfLines={1}>
            {address}
          </CustomText>
          <CustomText style={styles.dateText}>
            {createdAt ? formatISOToCustom(createdAt) : 'Date not available'}
          </CustomText>
          <CustomText style={styles.amountText}>
            ₹{totalAmount.toFixed(2)}
          </CustomText>
        </View>
        <TouchableOpacity
          style={styles.iconContainer}
          onPress={() => {
            navigate('AcceptOrder', {
              ...item,
            });
          }}>
          <Icon
            name="arrow-right-circle"
            size={RFValue(24)}
            color={Colors.primary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 0.7,
    padding: 10,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingVertical: 15,
    marginVertical: 10,
    backgroundColor: 'white',
  },
  flexRowBetween: {
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
  },
  statusContainer: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  statusText: {
    textTransform: 'capitalize',
    color: 'white',
  },
  itemsContainer: {
    width: '50%',
    marginTop: 10,
  },
  addressContainer: {
    marginTop: 10,
  },
  addressTextContainer: {
    width: '70%',
  },
  dateText: {
    marginTop: 2,
    fontSize: RFValue(8),
  },
  iconContainer: {
    alignItems: 'flex-end',
  },
  moreItemsText: {
    color: Colors.secondary || '#6c757d',
    fontSize: RFValue(10),
    fontStyle: 'italic',
  },
  amountText: {
    color: Colors.primary,
    fontSize: RFValue(12),
    fontWeight: 'bold',
    marginTop: 2,
  },
});

export default DeliveryOrderItem;
