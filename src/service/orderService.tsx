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

// API function to respond to order assignment
export const respondAssignment = async (
  orderId: string,
  deliveryAgentId: string,
  response: string,
) => {
  try {
    const apiResponse = await appAxios.post('/orders/assignment/respond', {
      orderId,
      deliveryAgentId,
      response,
    });
    return apiResponse.data;
  } catch (error) {
    console.error('Error responding to order assignment:', error);
    return null;
  }
};

// Interface for store details response
export interface StoreDetailsResponse {
  data: {
    distanceKm: number | null;
    dtCreated: string;
    dtUpdated: string;
    flActive: boolean;
    flDelete: boolean;
    idStore: number;
    idTenant: number;
    idUserCreated: number;
    idUserUpdated: number;
    nbDeliveryRadius: number | null;
    nbStoreSize: number;
    nmManager: string;
    nmStore: string;
    tmClosingTime: string;
    tmOpeningTime: string;
    txAddress: string;
    txCity: string;
    txDeliverySettings: string | null;
    txDescription: string | null;
    txEmail: string;
    txFeatures: string | null;
    txLatitude: string;
    txLogoUrl: string | null;
    txLongitude: string;
    txPaymentMethods: string | null;
    txPhone: string;
    txPinCode: string;
    txState: string;
    txStoreLocation: string;
    txStoreType: string;
    txZipCode: string | null;
  };
  error: string | null;
  status: string;
  success: boolean;
}

// API function to get store details by ID
export const getStoreDetails = async (
  idStore: number,
  idTenant: number = 1,
): Promise<StoreDetailsResponse | null> => {
  try {
    const response = await appAxios.post('/stores/getStoreById', {
      idStore,
      idTenant,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching store details:', error);
    return null;
  }
};

// Interface for order details response
export interface OrderDetailsResponse {
  data: {
    cdPaymentType: string;
    customerDTO: any;
    deliveryAddress: {
      dtCreated: string | null;
      dtUpdated: string | null;
      flFavorite: boolean;
      idAddress: number;
      idTenant: number;
      idUser: number;
      idUserCreated: number | null;
      idUserUpdated: number | null;
      txAddressLine1: string;
      txAddressLine2: string | null;
      txAddressType: string | null;
      txCity: string;
      txCountry: string;
      txFormattedAddress: string | null;
      txLandmark: string | null;
      txLatitude: string | null;
      txLongitude: string | null;
      txPhone: string;
      txPostalCode: string;
      txState: string;
    };
    deliveryAgentDTO: any;
    deliverySlot: {
      dtCreated: string | null;
      dtSlotDate: string;
      dtUpdated: string | null;
      idSlot: number;
      idTenant: number;
      idUserCreated: number | null;
      idUserUpdated: number | null;
      isAvailable: boolean;
      tmEndTime: string;
      tmStartTime: string;
    };
    dtCreated: string;
    dtUpdated: string;
    fkIdAddressDelivery: number;
    fkIdSlotDelivery: number;
    fkIdStoreDelivery: number;
    fkIdUserDelivery: number;
    idOrder: number;
    idTenant: number;
    idUser: number;
    idUserCreated: number;
    idUserUpdated: number;
    nbDeliveryCharge: number;
    nbGstCharge: number;
    nbHandlingCharge: number;
    nbSurgeCharge: number;
    nbTotalAmount: number;
    orderItems: Array<{
      dtCreated: string;
      idOrder: number;
      idOrderItem: number;
      idProduct: number;
      idTenant: number | null;
      idUserCreated: number | null;
      nbPrice: number;
      nbQuantity: number;
      nbSubtotal: number;
      productDescription: string;
      productImageUrl: string;
      txProductName: string;
    }>;
    status: string;
    storeDTO: {
      distanceKm: number | null;
      dtCreated: string;
      dtUpdated: string;
      flActive: boolean;
      flDelete: boolean;
      idStore: number;
      idTenant: number;
      idUserCreated: number;
      idUserUpdated: number;
      nbDeliveryRadius: number | null;
      nbStoreSize: number;
      nmManager: string;
      nmStore: string;
      tmClosingTime: string;
      tmOpeningTime: string;
      txAddress: string;
      txCity: string;
      txDeliverySettings: string | null;
      txDescription: string | null;
      txEmail: string;
      txFeatures: string | null;
      txLatitude: string;
      txLogoUrl: string | null;
      txLongitude: string;
      txPaymentMethods: string | null;
      txPhone: string;
      txPinCode: string;
      txState: string;
      txStoreLocation: string;
      txStoreType: string;
      txZipCode: string | null;
    };
    txCurLatitude: string;
    txCurLongitude: string;
    txFormattedAddress: string;
    txLatitude: string;
    txLongitude: string;
    txOrderNumber: string;
    txPinCodeDelivery: string;
  };
  error: string | null;
  status: string;
  success: boolean;
}

// API function to get order details
export const getOrderDetails = async (
  idOrder: number,
  idUser: number,
): Promise<OrderDetailsResponse | null> => {
  try {
    const response = await appAxios.post('/orders/getOrderDetails', {
      idOrder,
      idUser,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching order details:', error);
    return null;
  }
};
