"use client";

/**
 * Universal cart hook.
 * - If user is logged in (JWT in Redux auth): dispatches server-side cart thunks.
 * - If guest: uses local Redux guest actions.
 */
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  addGuestItem, updateGuestQty, removeGuestItem, clearGuest,
  addItemToCart, updateCartItemQty, removeCartItem, clearCartThunk,
  openCart, closeCart, toggleCart,
  CartItem,
} from "@/redux/slices/cartSlice";

interface AddPayload {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity?: number;
  selectedVariant?: string;
}

export function useCart() {
  const dispatch = useAppDispatch();
  const { items, loading, isOpen } = useAppSelector((s) => s.cart);
  const userInfo = useAppSelector((s) => s.auth.userInfo);
  const isAuth = !!userInfo?.token;

  const addToCart = (payload: AddPayload) => {
    if (isAuth) {
      dispatch(addItemToCart({ ...payload, quantity: payload.quantity ?? 1 }));
    } else {
      dispatch(addGuestItem({
        product: payload.productId,
        name: payload.name,
        image: payload.image,
        price: payload.price,
        quantity: payload.quantity ?? 1,
        selectedVariant: payload.selectedVariant ?? "",
      }));
    }
    dispatch(openCart());
  };

  const setQty = (item: CartItem, qty: number) => {
    if (isAuth) {
      if (qty <= 0) dispatch(removeCartItem(item._id));
      else dispatch(updateCartItemQty({ itemId: item._id, quantity: qty }));
    } else {
      dispatch(updateGuestQty({ _id: item._id, quantity: qty }));
    }
  };

  const remove = (item: CartItem) => {
    if (isAuth) dispatch(removeCartItem(item._id));
    else dispatch(removeGuestItem(item._id));
  };

  const clear = () => {
    if (isAuth) dispatch(clearCartThunk());
    else dispatch(clearGuest());
  };

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return {
    items, loading, isOpen, isAuth,
    addToCart, setQty, remove, clear,
    totalItems, totalPrice,
    open:   () => dispatch(openCart()),
    close:  () => dispatch(closeCart()),
    toggle: () => dispatch(toggleCart()),
  };
}
