export const FREE_SHIPPING_THRESHOLD = 4999;
export const SHIPPING_FEE = 200;

export const calculateShipping = (itemsPrice: number): number =>
  itemsPrice >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
