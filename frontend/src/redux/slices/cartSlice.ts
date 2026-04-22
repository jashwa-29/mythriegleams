import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../utils/api';

export interface CartItem {
    _id: string;           // server-side item id
    product: string;       // product ObjectId
    name: string;
    image: string;
    price: number;
    quantity: number;
    selectedVariant?: string;
}

interface CartState {
    items: CartItem[];
    loading: boolean;
    error: string | null;
    isOpen: boolean;
}

const initialState: CartState = {
    items: [],
    loading: false,
    error: null,
    isOpen: false,
};

/* ─── Thunks ─────────────────────────────────────────────────── */

export const fetchCart = createAsyncThunk('cart/fetch', async (_, thunkAPI) => {
    try {
        const { data } = await api.get('/cart');
        return data.data as CartItem[];
    } catch (err: any) {
        return thunkAPI.rejectWithValue(err.response?.data?.error || err.response?.data?.message || err.message);
    }
});

export const addItemToCart = createAsyncThunk(
    'cart/add',
    async (payload: { productId: string; name: string; image: string; price: number; quantity?: number; selectedVariant?: string }, thunkAPI) => {
        try {
            const { data } = await api.post('/cart', payload);
            return data.data as CartItem[];
        } catch (err: any) {
            return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);

export const updateCartItemQty = createAsyncThunk(
    'cart/updateQty',
    async ({ itemId, quantity }: { itemId: string; quantity: number }, thunkAPI) => {
        try {
            const { data } = await api.put(`/cart/${itemId}`, { quantity });
            return data.data as CartItem[];
        } catch (err: any) {
            return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);

export const removeCartItem = createAsyncThunk(
    'cart/remove',
    async (itemId: string, thunkAPI) => {
        try {
            const { data } = await api.delete(`/cart/${itemId}`);
            return data.data as CartItem[];
        } catch (err: any) {
            return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);

export const clearCartThunk = createAsyncThunk('cart/clear', async (_, thunkAPI) => {
    try {
        await api.delete('/cart');
        return [] as CartItem[];
    } catch (err: any) {
        return thunkAPI.rejectWithValue(err.response?.data?.error || err.response?.data?.message || err.message);
    }
});

/* ─── Slice ──────────────────────────────────────────────────── */

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        openCart:  (state) => { state.isOpen = true; },
        closeCart: (state) => { state.isOpen = false; },
        toggleCart:(state) => { state.isOpen = !state.isOpen; },
        // Guest cart (no auth) – local only
        addGuestItem: (state, action: PayloadAction<Omit<CartItem, '_id'>>) => {
            const existing = state.items.find(
                i => i.product === action.payload.product && i.selectedVariant === action.payload.selectedVariant
            );
            if (existing) {
                existing.quantity += action.payload.quantity;
            } else {
                state.items.push({ ...action.payload, _id: `guest_${Date.now()}` });
            }
            state.isOpen = true;
        },
        updateGuestQty: (state, action: PayloadAction<{ _id: string; quantity: number }>) => {
            const item = state.items.find(i => i._id === action.payload._id);
            if (item) {
                if (action.payload.quantity <= 0) {
                    state.items = state.items.filter(i => i._id !== action.payload._id);
                } else {
                    item.quantity = action.payload.quantity;
                }
            }
        },
        removeGuestItem: (state, action: PayloadAction<string>) => {
            state.items = state.items.filter(i => i._id !== action.payload);
        },
        clearGuest: (state) => { state.items = []; },
    },
    extraReducers: (builder) => {
        const setItems = (state: CartState, action: PayloadAction<CartItem[]>) => {
            state.items = action.payload;
            state.loading = false;
            state.isOpen = true;
        };
        builder
            .addCase(fetchCart.pending,          (state) => { state.loading = true; })
            .addCase(fetchCart.fulfilled,         (state, action) => { state.items = action.payload; state.loading = false; })
            .addCase(fetchCart.rejected,          (state, action) => { state.loading = false; state.error = action.payload as string; })
            .addCase(addItemToCart.pending,       (state) => { state.loading = true; })
            .addCase(addItemToCart.fulfilled,     setItems)
            .addCase(addItemToCart.rejected,      (state, action) => { state.loading = false; state.error = action.payload as string; })
            .addCase(updateCartItemQty.fulfilled, (state, action) => { state.items = action.payload; })
            .addCase(removeCartItem.fulfilled,    (state, action) => { state.items = action.payload; })
            .addCase(clearCartThunk.fulfilled,    (state) => { state.items = []; });
    },
});

export const { openCart, closeCart, toggleCart, addGuestItem, updateGuestQty, removeGuestItem, clearGuest } = cartSlice.actions;
export default cartSlice.reducer;
