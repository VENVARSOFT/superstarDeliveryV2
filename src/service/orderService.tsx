import {appAxios} from './apiInterceptors';
import {BRANCH_ID} from './config';

export const createOrder = async (items: any, totalPrice: number) => {
  try {
    const response = await appAxios.post('/order', {
      items: items,
      branch: BRANCH_ID,
      totalPrice: totalPrice,
    });
    return response.data;
  } catch (error) {
    return null;
  }
};

export const getOrderById = async (id: string) => {
  try {
    const response = await appAxios.get(`/order/${id}`);
    return response.data;
  } catch (error) {
    return null;
  }
};

export const fetchCustomerOrders = async (userId: string) => {
  try {
    const response = await appAxios.get(`/order?customerId=${userId}`);
    return response.data;
  } catch (error) {
    return null;
  }
};

export const fetchOrders = async (
  status: string,
  userId: string,
  branchId: string,
) => {
  let uri =
    status === 'available'
      ? `/order?status=${status}&branchId=${branchId}`
      : `/order?branchId=${branchId}&deliveryPartnerId=${userId}&status=delivered`;

  try {
    const response = await appAxios.get(uri);
    return response.data;
  } catch (error) {
    return null;
  }
};

export const sendLiveOrderUpdates = async (
  id: string,
  location: any,
  status: string,
) => {
  try {
    const response = await appAxios.patch(`/order/${id}/status`, {
      deliveryPersonLocation: location,
      status,
    });
    return response.data;
  } catch (error) {
    return null;
  }
};

export const confirmOrder = async (id: string, location: any) => {
  try {
    const response = await appAxios.post(`/order/${id}/confirm`, {
      deliveryPersonLocation: location,
    });
    return response.data;
  } catch (error) {
    return null;
  }
};

export const createOrUpdateOrderDetails = async (orderData: {
  idOrder: number | null;
  idUser: number;
  status: string;
  txOrderNumber: string;
  nbTotalAmount: number;
  orderItems: Array<{
    idProduct: number;
    txProductName: string;
    nbQuantity: number;
    nbPrice: number;
  }>;
  idUserCreated: number;
  dtCreated: string | null;
  idUserUpdated: number;
  dtUpdated: string | null;
  idTenant: number;
  fkIdAddressDelivery: number;
  fkIdSlotDelivery: number;
  txPinCodeDelivery: string;
  fkIdStoreDelivery: number | null;
  fkIdUserDelivery: number | null;
  cdPaymentType: string;
  txFormattedAddress: string;
  txLatitude: number;
  txLongitude: number;
  nbDeliveryCharge: number;
  nbHandlingCharge: number;
  nbSurgeCharge: number;
  nbGstCharge: number;
}) => {
  try {
    const response = await appAxios.post(
      '/orders/createOrUpdateOrderDetails',
      orderData,
    );
    return response.data;
  } catch (error) {
    console.error('Error creating/updating order:', error);
    return null;
  }
};

// Interface for order item
export interface OrderItem {
  idOrderItem: number;
  idOrder: number;
  idProduct: number;
  txProductName: string;
  nbQuantity: number;
  nbPrice: number;
  nbSubtotal: number;
  // Optional image urls if backend includes them for convenience
  txImageUrl?: string;
  txThumbnailUrl?: string;
  idUserCreated: number | null;
  dtCreated: string;
  idTenant: number | null;
}

// Interface for order
export interface Order {
  idOrder: number;
  idUser: number;
  status: string;
  txOrderNumber: string;
  nbTotalAmount: number;
  orderItems: OrderItem[];
  idUserCreated: number;
  dtCreated: string;
  idUserUpdated: number;
  dtUpdated: string;
  idTenant: number;
  fkIdAddressDelivery: number;
  fkIdSlotDelivery: number;
  txPinCodeDelivery: string;
  fkIdStoreDelivery: number | null;
  fkIdUserDelivery: number | null;
  cdPaymentType: string;
  txFormattedAddress: string;
  txLatitude: number;
  txLongitude: number;
  nbDeliveryCharge: number;
  nbHandlingCharge: number;
  nbSurgeCharge: number;
  nbGstCharge: number;
  customerDTO: any;
  deliveryAgentDTO: any;
  deliverySlot: any;
  deliveryAddress: any;
}

// Interface for API response
export interface GetUserCustomerOrdersResponse {
  data: Order[];
  status: string;
  error: string | null;
  success: boolean;
}

// API function to get user customer orders
export const getUserCustomerOrders = async (
  userId: number,
): Promise<GetUserCustomerOrdersResponse | null> => {
  try {
    const response = await appAxios.post('/orders/getUserCustomerOrders', {
      userId: userId,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching user customer orders:', error);
    return null;
  }
};

// Interface for nearest store response
export interface NearestStoreResponse {
  data: {
    idStore: number;
    nmStore: string;
    txPinCode: string;
    txAddress: string;
    flActive: boolean;
    flDelete: boolean;
    idUserCreated: number;
    dtCreated: string;
    idUserUpdated: number;
    dtUpdated: string;
    idTenant: number;
    txLongitude: string;
    txLatitude: string;
    txStoreType: string;
    txStoreLocation: string;
    nmManager: string;
    txPhone: string;
    txEmail: string;
    nbStoreSize: number;
    tmOpeningTime: string;
    tmClosingTime: string;
    txCity: string;
    txState: string;
    txZipCode: string;
  };
  status: string;
  error: string | null;
  success: boolean;
}

// API function to get nearest store
export const getNearestStore = async (
  longitude: string,
  latitude: string,
  idTenant: number = 1,
  maxDistanceKm: number = 25.0,
): Promise<NearestStoreResponse | null> => {
  try {
    const response = await appAxios.post('/stores/getNearestStore', {
      longitude,
      latitude,
      idTenant,
      maxDistanceKm,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching nearest store:', error);
    return null;
  }
};

// Interface for delivery agent order response
export interface DeliveryAgentOrderResponse {
  data: Order[];
  status: string;
  error: string | null;
  success: boolean;
}

// API function to get delivery agent orders
export const getDeliveryAgentOrders = async (
  userDeliveryAgentId: number,
): Promise<DeliveryAgentOrderResponse | null> => {
  try {
    const response = await appAxios.post(
      '/orders/deliveryagents/getUserDeliveryAgentOrders',
      {
        userDeliveryAgentId: userDeliveryAgentId,
      },
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching delivery agent orders:', error);
    return null;
  }
};
