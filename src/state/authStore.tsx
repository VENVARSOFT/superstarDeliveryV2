// Redux-backed replacement keeping the same hook API
import {useDispatch, useSelector} from 'react-redux';
import type {RootState} from './store';
import {
  setUser as setUserAction,
  setTokens as setTokensAction,
  setCurrentOrder as setCurrentOrderAction,
  setSelectedSlot as setSelectedSlotAction,
  setSelectedPaymentMethod as setSelectedPaymentMethodAction,
  setReorderId as setReorderIdAction,
  logout as logoutAction,
  updateToken as updateTokenAction,
} from './authSlice';

interface AuthStoreHook {
  user: Record<string, any> | null;
  setUser: (user: any) => void;
  setTokens: (tokens: {
    token: string;
    refreshToken: string;
    tokenExpiry: string;
  }) => void;
  setCurrentOrder: (order: any) => void;
  currentOrder: Record<string, any> | null;
  selectedSlot: any | null;
  setSelectedSlot: (slot: any) => void;
  selectedPaymentMethod: string | null;
  setSelectedPaymentMethod: (method: string | null) => void;
  reorderId: number | null;
  setReorderId: (id: number | null) => void;
  logout: () => void;
  updateToken: (tokens: {token: string; tokenExpiry: string}) => void;
}

export const useAuthStore = (): AuthStoreHook => {
  const dispatch = useDispatch();
  const {user, currentOrder, selectedSlot} = useSelector(
    (state: RootState) => state.auth,
  );

  return {
    user,
    currentOrder,
    selectedSlot,
    selectedPaymentMethod: useSelector(
      (state: RootState) => state.auth.selectedPaymentMethod,
    ) as any,
    reorderId: useSelector((state: RootState) => state.auth.reorderId) as any,
    setUser: (u: any) => dispatch(setUserAction(u)),
    setTokens: (tokens: {
      token: string;
      refreshToken: string;
      tokenExpiry: string;
    }) => dispatch(setTokensAction(tokens)),
    setCurrentOrder: (o: any) => dispatch(setCurrentOrderAction(o)),
    setSelectedSlot: (s: any) => dispatch(setSelectedSlotAction(s)),
    setSelectedPaymentMethod: (m: string | null) =>
      dispatch(setSelectedPaymentMethodAction(m)),
    setReorderId: (id: number | null) => dispatch(setReorderIdAction(id)),
    logout: () => dispatch(logoutAction()),
    updateToken: (tokens: {token: string; tokenExpiry: string}) =>
      dispatch(updateTokenAction(tokens)),
  };
};
