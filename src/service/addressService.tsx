import {appAxios} from './apiInterceptors';

export interface AddressPayload {
  idUser: number | string;
  idTenant: number;
  txAddressLine1: string | null;
  txAddressLine2: string | null;
  txCity: string | null;
  txState: string | null;
  txPostalCode: string | null | string;
  txCountry: string | null;
  txLatitude: number | string | null;
  txLongitude: number | string | null;
  txFormattedAddress: string | null;
  flFavorite: boolean;
  txAddressType: 'Home' | 'Work' | 'Other' | string;
  txPhone?: string | null;
}

export interface AddressResponse {
  idAddress: number;
  idUser: number;
  txAddressLine1: string | null;
  txAddressLine2: string | null;
  txCity: string | null;
  txState: string | null;
  txPostalCode: string | null;
  txCountry: string | null;
  flFavorite: boolean;
  txPhone: string | null;
  txLandmark: string | null;
  txAddressType: string | null;
  txLatitude: string | null;
  txLongitude: string | null;
  txFormattedAddress: string | null;
  idUserCreated: number | null;
  dtCreated: string | null;
  idUserUpdated: number | null;
  dtUpdated: string | null;
  idTenant: number;
}

export interface GetAddressesResponse {
  data: AddressResponse[];
  status: string;
  error: string | null;
  success: boolean;
}

export const createOrUpdateAddress = async (
  payload: AddressPayload,
): Promise<any> => {
  try {
    const response = await appAxios.post(
      '/addresses/createOrUpdateAddress',
      payload,
    );
    return response.data;
  } catch (error) {
    return null;
  }
};

export const getAddresses = async (
  idUser: number | string,
  idTenant: number = 1,
): Promise<GetAddressesResponse | null> => {
  try {
    const response = await appAxios.post('/addresses/getAddresses', {
      idUser,
      idTenant,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return null;
  }
};
