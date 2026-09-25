import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import productReducer from './slices/productSlice';
import orderReducer from './slices/orderSlice';
import inquiryReducer from './slices/inquirySlice';
import userReducer from './slices/userSlice';
import collectionReducer from './slices/collectionSlice';
import occasionReducer from './slices/occasionSlice';
import homepageSettingsReducer from './slices/homepageSettingsSlice';
import cartReducer from './slices/cartSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        products: productReducer,
        orders: orderReducer,
        inquiries: inquiryReducer,
        users: userReducer,
        collections: collectionReducer,
        occasions: occasionReducer,
        homepageSettings: homepageSettingsReducer,
        cart: cartReducer,
    }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
