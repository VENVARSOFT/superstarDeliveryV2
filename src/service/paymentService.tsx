import {appAxios} from './apiInterceptors';

export interface CreatePhonePeOrderRequest {
  phoneNumber: string | number;
  amount: number; // rupees (e.g., 123.45)
}

export interface CreatePhonePeOrderResponse {
  amount: string; // in paise as string, e.g., "12345"
  endpoint: string;
  appPaymentOrderId: string; // merchant transaction/order id on app side
  payload: string; // base64-encoded request body for SDK
  checksum: string; // may be needed by backend, not by SDK
  currency: string; // e.g., INR
  merchantTransactionId?: string; // optional, backend may send it
}

export const createPhonePeOrder = async (
  data: CreatePhonePeOrderRequest,
): Promise<CreatePhonePeOrderResponse> => {
  const res = await appAxios.post<CreatePhonePeOrderResponse>(
    '/payments/phonepe/createOrder',
    data,
  );
  return res.data;
};

export interface VerifyPhonePeRequest {
  appPaymentOrderId: string;
  merchantTransactionId?: string;
}

export interface VerifyPhonePeResponse {
  success: boolean;
  status?: string;
  message?: string;
  data?: any;
}

export const verifyPhonePePayment = async (
  appPaymentOrderId: string,
  merchantTransactionId?: string,
): Promise<VerifyPhonePeResponse> => {
  console.log('Verifying payment with orderId:', appPaymentOrderId);
  const requestData: VerifyPhonePeRequest = {
    appPaymentOrderId,
    merchantTransactionId,
  };
  console.log('Verification request data:', requestData);

  const res = await appAxios.post<VerifyPhonePeResponse>(
    '/payments/phonepe/verify',
    requestData,
  );

  console.log('Verification response:', res.data);
  return res.data;
};
