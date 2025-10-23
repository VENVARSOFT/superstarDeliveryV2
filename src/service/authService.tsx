import axios from 'axios';
import {BASE_URL, USER_TYPES} from './config';
import {tokenStorage} from '@state/storage';
// import {useAuthStore} from '@state/authStore';
import {resetAndNavigate} from '@utils/NavigationUtils';
import {appAxios} from './apiInterceptors';
import {tokenManager} from '@utils/tokenManager';

export const customerLogin = async (phone: string) => {
  try {
    const response = await axios.post(`${BASE_URL}/customer/login`, {phone});
    const {accessToken, refreshToken} = response.data;
    // Store tokens using tokenManager
    tokenManager.storeTokens({
      token: accessToken,
      refreshToken: refreshToken,
      tokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const refresh_tokens = async () => {
  try {
    const refreshToken = tokenManager.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await axios.post(`${BASE_URL}auth/refresh-token`, {
      refreshToken,
    });

    if (response.data.success && response.data.data) {
      const {accessToken, refreshToken: newRefreshToken} = response.data.data;

      // Calculate new token expiry (assuming 10 days from now, adjust as needed)
      const tokenExpiry = new Date(
        Date.now() + 10 * 24 * 60 * 60 * 1000,
      ).toISOString();

      // Store new tokens using token manager
      tokenManager.storeTokens({
        token: accessToken,
        refreshToken: newRefreshToken,
        tokenExpiry,
      });

      // Note: State updates should be handled by the calling component
      // The refresh_tokens function returns the new token for the component to handle

      return accessToken;
    } else {
      throw new Error(response.data.error || 'Token refresh failed');
    }
  } catch (error: any) {
    tokenManager.clearTokens();
    resetAndNavigate('CustomerLogin');
    throw error;
  }
};

export const refetchUser = async (setUser: any) => {
  try {
    const response = await appAxios.get('/user');
    setUser(response.data.user);
  } catch (error) {}
};

export const updateUserLocation = async (data: any, setUser: any) => {
  try {
    await appAxios.patch('/user', data);
    refetchUser(setUser);
  } catch (error) {}
};

export const generateOTP = async (phoneNumber: string) => {
  try {
    const response = await axios.post(`${BASE_URL}auth/generate-otp`, {
      phoneNumber: phoneNumber,
      userType: USER_TYPES.DELIVERY_PARTNER,
    });
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const verifyOTP = async (
  phoneNumber: string,
  otp: string,
  userType: string = USER_TYPES.DELIVERY_PARTNER,
) => {
  try {
    const response = await axios.post(`${BASE_URL}auth/login`, {
      nbPhone: phoneNumber,
      otp: otp,
      application: 'mobile',
      privacy: true,
      userType: userType,
    });
    if (response.data.success && response.data.data) {
      const {token, refreshToken, tokenExpiry, idUser} = response.data.data;

      // Store tokens using token manager
      tokenManager.storeTokens({
        token,
        refreshToken,
        tokenExpiry,
      });
      tokenStorage.set('userId', idUser.toString());

      // Return the complete response data including user information
      return response.data;
    } else {
      throw new Error(response.data.error || 'OTP verification failed');
    }
  } catch (error: any) {
    throw error;
  }
};

export const getUserDetails = async (idUser: number, txPhoneNumber: string) => {
  try {
    const response = await appAxios.post('/users/getUserDetails', {
      idUser,
      txPhoneNumber,
    });
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// Create or update user details (POST users/createOrUpdateUserDetails)
export const updateUserProfile = async (data: {
  idUser: number | string;
  nmFirst?: string | null;
  nmLast?: string | null;
  nmUserType?: string;
  nmRole?: string | null;
  nbPhone?: string;
  idEmail?: string | null;
  txPassword?: string | null;
}) => {
  try {
    const response = await appAxios.post(
      '/users/createOrUpdateUserDetails',
      data,
    );
    return response.data;
  } catch (error: any) {
    throw error;
  }
};
