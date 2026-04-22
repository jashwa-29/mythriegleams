import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

interface OrderState {
    orders: any[];
    currentOrder: any | null;
    loading: boolean;
    error: string | null;
    success: boolean;
}

const initialState: OrderState = {
    orders: [],
    currentOrder: null,
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

const orderSlice = createSlice({
    name: 'orders',
    initialState,
    reducers: {
        resetOrderSuccess: (state) => {
            state.success = false;
            state.currentOrder = null;
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
            });
    }
});

export const { resetOrderSuccess } = orderSlice.actions;
export default orderSlice.reducer;
