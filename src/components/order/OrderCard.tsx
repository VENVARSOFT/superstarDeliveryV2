import React from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import CustomText from '@components/ui/CustomText';
import {Colors, Fonts} from '@utils/Constants';
import {RFValue} from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Order} from '@service/orderService';

interface OrderCardProps {
  order: Order;
  onShowDetails: (order: Order) => void;
  onReorder: (order: Order) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onShowDetails,
  onReorder,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return Colors.primary;
      case 'COMPLETED':
      case 'DELIVERED':
        return '#4CAF50';
      case 'CANCELLED':
        return '#F44336';
      default:
        return Colors.disabled;
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'Active';
      case 'COMPLETED':
      case 'DELIVERED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.orderInfo}>
          <CustomText variant="h6" fontFamily={Fonts.SemiBold}>
            {order.txOrderNumber}
          </CustomText>
          <CustomText variant="h8" style={styles.dateText}>
            {formatDate(order.dtCreated)} • {formatTime(order.dtCreated)}
          </CustomText>
        </View>
        <View
          style={[
            styles.statusBadge,
            {backgroundColor: getStatusColor(order.status)},
          ]}>
          <CustomText
            variant="h9"
            style={styles.statusText}
            fontFamily={Fonts.Medium}>
            {getStatusText(order.status)}
          </CustomText>
        </View>
      </View>

      {/* Order Items */}
      <View style={styles.itemsContainer}>
        {order.orderItems.slice(0, 2).map((item, _index) => (
          <View key={item.idOrderItem} style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <CustomText
                variant="h8"
                fontFamily={Fonts.Medium}
                numberOfLines={1}>
                {item.txProductName}
              </CustomText>
              <CustomText variant="h9" style={styles.quantityText}>
                Qty: {item.nbQuantity}
              </CustomText>
            </View>
            <CustomText variant="h8" fontFamily={Fonts.SemiBold}>
              ₹{item.nbSubtotal.toFixed(2)}
            </CustomText>
          </View>
        ))}
        {order.orderItems.length > 2 && (
          <CustomText variant="h9" style={styles.moreItemsText}>
            +{order.orderItems.length - 2} more items
          </CustomText>
        )}
      </View>

      {/* Total Amount */}
      <View style={styles.totalContainer}>
        <CustomText variant="h7" fontFamily={Fonts.SemiBold}>
          Total: ₹{order.nbTotalAmount.toFixed(2)}
        </CustomText>
      </View>

      {/* Delivery Address */}
      <View style={styles.addressContainer}>
        <Icon name="map-marker" size={RFValue(14)} color={Colors.disabled} />
        <CustomText variant="h9" style={styles.addressText} numberOfLines={2}>
          {order.txFormattedAddress}
        </CustomText>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => onShowDetails(order)}>
          <CustomText
            variant="h8"
            style={styles.detailsButtonText}
            fontFamily={Fonts.Medium}>
            Show Order Details
          </CustomText>
        </TouchableOpacity>

        {order.status.toUpperCase() === 'COMPLETED' ||
        order.status.toUpperCase() === 'DELIVERED' ? (
          <TouchableOpacity
            style={styles.reorderButton}
            onPress={() => onReorder(order)}>
            <Icon name="refresh" size={RFValue(16)} color={Colors.primary} />
            <CustomText
              variant="h8"
              style={styles.reorderButtonText}
              fontFamily={Fonts.Medium}>
              Reorder
            </CustomText>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  dateText: {
    color: Colors.disabled,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
  },
  itemsContainer: {
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  quantityText: {
    color: Colors.disabled,
    marginTop: 2,
  },
  moreItemsText: {
    color: Colors.disabled,
    fontStyle: 'italic',
    marginTop: 4,
  },
  totalContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  addressText: {
    color: Colors.disabled,
    marginLeft: 8,
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailsButton: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  detailsButtonText: {
    color: Colors.text,
  },
  reorderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  reorderButtonText: {
    color: Colors.primary,
    marginLeft: 6,
  },
});

export default OrderCard;
