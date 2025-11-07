import {appAxios} from './apiInterceptors';

export const acceptRideOffer = async (rideId: string) => {
  try {
    const response = await appAxios.patch(`/ride/accept/${rideId}`);
    return response.data;
  } catch (error) {
    console.error('Error accepting ride offer:', error);
    return null;
  }
};

