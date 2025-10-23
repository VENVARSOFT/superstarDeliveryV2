import {createSlice, PayloadAction} from '@reduxjs/toolkit';

export interface User {
  idUser: number;
  nmFirst: string | null;
  nmLast: string | null;
  nmUserType: string;
  nmRole: string | null;
  adWork: string | null;
  adHome: string | null;
  adOther: string | null;
  idTenant: string | null;
  idEmail: string | null;
  nbPhone: string;
  txPassword: string;
  nbRecentOtp: string | null;
  dtCreated: string;
  dtUpdated: string;
  flActive: boolean;
  cdSegmentType: string | null;
  nmBusiness: string | null;
  txTaxId: string | null;
  nbCreditLimit: string | null;
  cdLoyalityTier: string | null;
  flVerified: boolean | null;
  cdCommPref: string | null;
  flEmailNotifications: boolean | null;
  flEmailMarketings: boolean | null;
  flEmailNewsletter: boolean | null;
  flSmsUpdates: boolean | null;
  txNotes: string | null;
  cdVehicleType: string | null;
  txVehicleNumber: string | null;
  txVehicleLicence: string | null;
  flDrivingLicence: boolean | null;
  flVehicleIns: boolean | null;
  flVehicleRegistration: boolean | null;
  flBGCheck: boolean | null;
  flVerifiedAgent: boolean | null;
  nmAltContact: string | null;
  cdAltRelationship: string | null;
  txAltContactNumber: string | null;
  txLongitude: string | null;
  txLatitude: string | null;
  liveLocation?: {
    latitude: number;
    longitude: number;
  };
  address?: string;
}

export interface SelectedSlot {
  idSlot: number;
  dtSlotDate: string;
  tmStartTime: string;
  tmEndTime: string;
  isAvailable: boolean;
  idTenant: number;
}

export interface AuthState {
  user: User | null;
  currentOrder: Record<string, any> | null;
  selectedSlot: SelectedSlot | null;
  selectedPaymentMethod: string | null;
  reorderId: number | null;
  token: string | null;
  refreshToken: string | null;
  tokenExpiry: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  currentOrder: null,
  selectedSlot: null,
  selectedPaymentMethod: 'CASH',
  reorderId: null,
  token: null,
  refreshToken: null,
  tokenExpiry: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    setTokens(
      state,
      action: PayloadAction<{
        token: string;
        refreshToken: string;
        tokenExpiry: string;
      }>,
    ) {
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.tokenExpiry = action.payload.tokenExpiry;
    },
    setCurrentOrder(state, action: PayloadAction<any>) {
      state.currentOrder = action.payload;
    },
    setSelectedSlot(state, action: PayloadAction<SelectedSlot | null>) {
      state.selectedSlot = action.payload;
    },
    setSelectedPaymentMethod(state, action: PayloadAction<string | null>) {
      state.selectedPaymentMethod = action.payload;
    },
    setReorderId(state, action: PayloadAction<number | null>) {
      state.reorderId = action.payload;
    },
    logout(state) {
      state.user = null;
      state.currentOrder = null;
      state.selectedSlot = null;
      state.selectedPaymentMethod = 'CASH';
      state.reorderId = null;
      state.token = null;
      state.refreshToken = null;
      state.tokenExpiry = null;
      state.isAuthenticated = false;
    },
    updateToken(
      state,
      action: PayloadAction<{token: string; tokenExpiry: string}>,
    ) {
      state.token = action.payload.token;
      state.tokenExpiry = action.payload.tokenExpiry;
    },
  },
});

export const {
  setUser,
  setTokens,
  setCurrentOrder,
  setSelectedSlot,
  setSelectedPaymentMethod,
  setReorderId,
  logout,
  updateToken,
} = authSlice.actions;
export default authSlice.reducer;
