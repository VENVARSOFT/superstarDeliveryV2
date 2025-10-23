import {useDispatch, useSelector} from 'react-redux';
import type {RootState} from './store';
import {
  addItem as addItemAction,
  removeItem as removeItemAction,
  clearCart as clearCartAction,
  setCartTotal as setCartTotalAction,
  populateCartFromOrder as populateCartFromOrderAction,
} from './cartSlice';

interface CartItem {
  _id: string | number;
  item: any;
  count: number;
}

interface CartStore {
  cart: CartItem[];
  cartTotal: number;
  addItem: (item: any) => void;
  removeItem: (id: string | number) => void;
  clearCart: () => void;
  setCartTotal: (total: number) => void;
  populateCartFromOrder: (items: CartItem[]) => void;
  getItemCount: (id: string | number) => number;
  getTotalPrice: () => number;
}

export const useCartStore = (): CartStore => {
  const dispatch = useDispatch();
  const cart = useSelector((state: RootState) => state.cart.cart);
  const cartTotal = useSelector((state: RootState) => state.cart.cartTotal);

  return {
    cart,
    cartTotal,
    addItem: (item: any) => dispatch(addItemAction(item)),
    removeItem: (id: string | number) => dispatch(removeItemAction(id)),
    clearCart: () => dispatch(clearCartAction()),
    setCartTotal: (total: number) => dispatch(setCartTotalAction(total)),
    populateCartFromOrder: (items: CartItem[]) =>
      dispatch(populateCartFromOrderAction(items)),
    getItemCount: (id: string | number) => {
      const currentItem = cart.find(cartItem => cartItem._id === id);
      return currentItem ? currentItem.count : 0;
    },
    getTotalPrice: () => {
      // Return the automatically calculated cartTotal from Redux
      return cartTotal;
    },
  };
};
