import {appAxios} from './apiInterceptors';

export interface DeliverySlot {
  idSlot: number;
  dtSlotDate: string;
  tmStartTime: string;
  tmEndTime: string;
  isAvailable: boolean;
  idUserCreated: number | null;
  dtCreated: string | null;
  idUserUpdated: number | null;
  dtUpdated: string | null;
  idTenant: number;
}

export interface SlotsResponse {
  data: {[date: string]: DeliverySlot[]};
  status: string;
  error: string | null;
  success: boolean;
}

export const getSlots = async (
  idTenant: number = 1,
): Promise<SlotsResponse | null> => {
  try {
    const response = await appAxios.post('/slots/getSlots', {
      idTenant,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching slots:', error);
    return null;
  }
};
