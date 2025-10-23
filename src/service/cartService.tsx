import {appAxios} from './apiInterceptors';
import {tokenStorage} from '@state/storage';

export interface CartAddPayload {
  idUser: number;
  idProduct: number;
  nbQuantity: number;
}

export interface CartUpdatePayload extends CartAddPayload {}

export interface CartRemovePayload {
  idUser: number;
  idProduct: number;
}

const getUserId = (): number => {
  const userIdStr = tokenStorage.getString('userId');
  const idUser = userIdStr ? parseInt(userIdStr, 10) : NaN;
  if (!idUser || Number.isNaN(idUser)) {
    throw new Error('User ID not found');
  }
  return idUser;
};

export const addToCart = async (idProduct: number, nbQuantity: number = 1) => {
  const idUser = getUserId();
  const payload: CartAddPayload = {idUser, idProduct, nbQuantity};
  const res = await appAxios.post('cart/add', payload);
  return res.data;
};

export const updateCart = async (idProduct: number, nbQuantity: number) => {
  const idUser = getUserId();
  const payload: CartUpdatePayload = {idUser, idProduct, nbQuantity};
  const res = await appAxios.put('cart/update', payload);
  return res.data;
};

export const removeFromCart = async (idProduct: number) => {
  const idUser = getUserId();
  const payload: CartRemovePayload = {idUser, idProduct};
  const res = await appAxios.delete('cart/remove', {data: payload});
  return res.data;
};

export const getCartItems = async (orderId?: number) => {
  const idUser = getUserId();
  const payload: {userId: number; orderId?: number} = {userId: idUser};
  if (orderId) {
    payload.orderId = orderId;
  }
  const res = await appAxios.post('cart/items', payload);
  return res.data;
};
