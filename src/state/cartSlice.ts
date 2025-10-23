import {createSlice, PayloadAction} from '@reduxjs/toolkit';

export interface CartItem {
  _id: string | number;
  item: any;
  count: number;
}

export interface CartState {
  cart: CartItem[];
  cartTotal: number;
}

const initialState: CartState = {
  cart: [],
  cartTotal: 0,
};

// Helper function to calculate cart total from cart items
const calculateCartTotal = (cart: CartItem[]): number => {
  return cart.reduce((total, ci) => {
    const price = ci.item?.nbSellingPrice ?? ci.item?.price ?? 0;
    return total + price * ci.count;
  }, 0);
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem(state, action: PayloadAction<any>) {
      const item = action.payload;
      const existingIndex = state.cart.findIndex(ci => ci._id === item._id);
      if (existingIndex >= 0) {
        state.cart[existingIndex].count += 1;
      } else {
        state.cart.push({_id: item._id, item, count: 1});
      }
      // Recalculate cart total after adding item
      state.cartTotal = calculateCartTotal(state.cart);
    },
    removeItem(state, action: PayloadAction<string | number>) {
      const id = action.payload;
      const existingIndex = state.cart.findIndex(ci => ci._id === id);
      if (existingIndex >= 0) {
        const existing = state.cart[existingIndex];
        if (existing.count > 1) {
          existing.count -= 1;
        } else {
          state.cart.splice(existingIndex, 1);
        }
      }
      // Recalculate cart total after removing item
      state.cartTotal = calculateCartTotal(state.cart);
    },
    clearCart(state) {
      state.cart = [];
      state.cartTotal = 0;
    },
    setCartTotal(state, action: PayloadAction<number>) {
      state.cartTotal = action.payload;
    },
    populateCartFromOrder(state, action: PayloadAction<CartItem[]>) {
      state.cart = action.payload;
      state.cartTotal = calculateCartTotal(state.cart);
    },
  },
});

export const {
  addItem,
  removeItem,
  clearCart,
  setCartTotal,
  populateCartFromOrder,
} = cartSlice.actions;
export default cartSlice.reducer;
