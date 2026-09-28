import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../utils/api';

interface OrderState {
    orders: any[];
    currentOrder: any | null;
    customOrder: any | null;
    /** Offline intake keeps its own slice of state so it never fights the order table for `loading`. */
    offlineOrders: any[];
    offlineLoading: boolean;
    loading: boolean;
    error: string | null;
    success: boolean;
}

const initialState: OrderState = {
    orders: [],
    currentOrder: null,
    customOrder: null,
    offlineOrders: [],
    offlineLoading: false,
    loading: false,
    error: null,
    success: false,
};

export const createOrder = createAsyncThunk(
    'orders/create',
    async ({ orderData, isGuest: _isGuest }: { orderData: any; isGuest: boolean }, thunkAPI) => {
        try {
            // Unified route: backend handles guest vs authenticated via optionalAuth middleware
            const { data } = await api.post('/orders', orderData);
            return data.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.error || error.response?.data?.message || error.message);
        }
    }
);

export const getMyOrders = createAsyncThunk(
    'orders/myOrders',
    async (_, thunkAPI) => {
        try {
            const { data } = await api.get('/orders/mine');
            return data.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.error || error.response?.data?.message || error.message);
        }
    }
);

export const fetchOrders = createAsyncThunk(
    'orders/fetchAll',
    async (params: { includeUnpaid?: boolean } | undefined, thunkAPI) => {
        try {
            const includeUnpaid = params?.includeUnpaid || false;
            const { data } = await api.get(`/orders?includeUnpaid=${includeUnpaid}`);
            return data.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.error || error.response?.data?.message || error.message);
        }
    }
);

export const updateOrderStatus = createAsyncThunk(
    'orders/updateStatus',
    async ({ id, status, trackingNumber, deliveryNote }: { id: string, status: string, trackingNumber?: string, deliveryNote?: string }, thunkAPI) => {
        try {
            const { data } = await api.put(`/orders/${id}/status`, { status, trackingNumber, deliveryNote });
            return data.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.error || error.response?.data?.message || error.message);
        }
    }
);

/**
 * Record a payment the gateway never saw (bank transfer, cash, UPI done offline).
 * The backend refuses an already-paid order, so this can never double-confirm.
 */
export const markOrderPaid = createAsyncThunk(
    'orders/markPaid',
    async ({ id, method, reference, note }: { id: string; method: string; reference?: string; note?: string }, thunkAPI) => {
        try {
            const { data } = await api.put(`/orders/${id}/paid`, { method, reference, note });
            return { order: data.data, message: data.message as string };
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.error || error.response?.data?.message || error.message);
        }
    }
);

export interface AdminCustomOrderPayload {
    customerName: string;
    customerEmail?: string;
    customerPhone: string;
    customerStreet?: string;
    customerCity?: string;
    customerState?: string;
    customerZip?: string;
    amount: number;
    title?: string;
    description?: string;
    image?: string;
    weight?: number;
}

export const createAdminCustomOrder = createAsyncThunk(
    'orders/createAdminCustom',
    async (payload: AdminCustomOrderPayload, thunkAPI) => {
        try {
            const { data } = await api.post('/orders/admin/custom', payload);
            return data.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.error || error.response?.data?.message || error.message);
        }
    }
);

export interface OfflineLineItem {
    /** Product ObjectId — the server re-derives name/price/weight from this. */
    product: string;
    qty: number;
    selectedVariant?: string;
    selectedColor?: string;
}

export interface OfflineCustomItem {
    name: string;
    amount: number;
    qty?: number;
    weight?: number;
    image?: string;
    description?: string;
}

export interface AdminOfflineOrderPayload {
    customerName: string;
    customerEmail?: string;
    customerPhone: string;
    customerStreet?: string;
    customerCity?: string;
    customerState?: string;
    customerZip?: string;
    items: OfflineLineItem[];
    /** One-off piece that is not in the catalogue (bespoke sets, repairs). */
    customItem?: OfflineCustomItem;
    /** Money already in hand (cash, UPI, bank transfer) — recorded through the same audited path. */
    paymentReceived?: boolean;
    method?: string;
    reference?: string;
    note?: string;
}

export const createOfflineOrder = createAsyncThunk(
    'orders/createOffline',
    async (payload: AdminOfflineOrderPayload, thunkAPI) => {
        try {
            const { data } = await api.post('/orders/admin/offline', payload);
            return { order: data.data, message: data.message as string, warnings: (data.warnings || []) as string[] };
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.error || error.response?.data?.message || error.message);
        }
    }
);

export const fetchOfflineOrders = createAsyncThunk(
    'orders/fetchOffline',
    async (_, thunkAPI) => {
        try {
            const { data } = await api.get('/orders/admin/offline');
            return data.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.error || error.response?.data?.message || error.message);
        }
    }
);

const orderSlice = createSlice({
    name: 'orders',
    initialState,
    reducers: {
        setCurrentOrder: (state, action: PayloadAction<Record<string, unknown>>) => {
            state.currentOrder = action.payload;
            state.success = true;
        },
        resetOrderSuccess: (state) => {
            state.success = false;
            state.currentOrder = null;
            state.error = null;
        },
        clearCustomOrder: (state) => {
            state.customOrder = null;
            state.success = false;
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchOrders.pending,  (state) => { state.loading = true; })
            .addCase(fetchOrders.fulfilled, (state, action) => { state.orders = action.payload; state.loading = false; })
            .addCase(fetchOrders.rejected,  (state, action) => { state.loading = false; state.error = action.payload as string; })
            .addCase(getMyOrders.pending,   (state) => { state.loading = true; })
            .addCase(getMyOrders.fulfilled, (state, action) => { state.orders = action.payload; state.loading = false; })
            .addCase(getMyOrders.rejected,  (state, action) => { state.loading = false; state.error = action.payload as string; })
            .addCase(createOrder.pending,   (state) => { state.loading = true; state.error = null; })
            .addCase(createOrder.fulfilled, (state, action) => { state.currentOrder = action.payload; state.loading = false; state.success = true; })
            .addCase(createOrder.rejected,  (state, action) => { state.loading = false; state.error = action.payload as string; })
            .addCase(updateOrderStatus.pending, (state) => {
                state.error = null;
                state.success = false;
            })
            .addCase(updateOrderStatus.fulfilled, (state, action) => {
                state.orders = state.orders.map(o => o._id === action.payload._id ? action.payload : o);
                state.success = true;
            })
            .addCase(updateOrderStatus.rejected, (state, action) => {
                state.error = action.payload as string;
                state.success = false;
            })
            .addCase(markOrderPaid.rejected, (state, action) => {
                state.error = null;
                state.success = false;
            })
            .addCase(markOrderPaid.fulfilled, (state, action) => {
                // Deliberately no `success` flag: the page reports the outcome itself so it can
                // say "marked as paid" instead of the generic "Order Updated".
                state.orders = state.orders.map(o => o._id === action.payload.order._id ? action.payload.order : o);
                state.offlineOrders = state.offlineOrders.map(o => o._id === action.payload.order._id
                    ? { ...o, ...action.payload.order }
                    : o);
                state.currentOrder = state.currentOrder?._id === action.payload.order._id
                    ? action.payload.order
                    : state.currentOrder;
            })
            .addCase(createAdminCustomOrder.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(createAdminCustomOrder.fulfilled, (state, action) => {
                state.customOrder = action.payload;
                state.loading = false;
                state.success = true;
            })
            .addCase(createAdminCustomOrder.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
                state.success = false;
            })
            .addCase(createOfflineOrder.pending, (state) => {
                state.offlineLoading = true;
                state.error = null;
            })
            .addCase(createOfflineOrder.fulfilled, (state) => {
                state.offlineLoading = false;
            })
            .addCase(createOfflineOrder.rejected, (state, action) => {
                state.offlineLoading = false;
                state.error = action.payload as string;
            })
            .addCase(fetchOfflineOrders.pending, (state) => { state.offlineLoading = true; })
            .addCase(fetchOfflineOrders.fulfilled, (state, action) => {
                state.offlineOrders = action.payload;
                state.offlineLoading = false;
            })
            .addCase(fetchOfflineOrders.rejected, (state, action) => {
                state.offlineLoading = false;
                state.error = action.payload as string;
            });
    }
});

export const { setCurrentOrder, resetOrderSuccess, clearCustomOrder } = orderSlice.actions;
export default orderSlice.reducer;
