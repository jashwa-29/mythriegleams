import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

interface InquiryState {
    inquiries: any[];
    loading: boolean;
    error: string | null;
    success: boolean;
}

const initialState: InquiryState = {
    inquiries: [],
    loading: false,
    error: null,
    success: false
};

export const fetchInquiries = createAsyncThunk(
    'inquiries/fetchAll',
    async (_, thunkAPI) => {
        try {
            const { data } = await api.get('/inquiries');
            return data.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.error || error.response?.data?.message || error.message);
        }
    }
);

export const createInquiry = createAsyncThunk(
    'inquiries/create',
    async (inquiryData: FormData, thunkAPI) => {
        try {
            const { data } = await api.post('/inquiries', inquiryData);
            return data.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.error || error.response?.data?.message || error.message);
        }
    }
);

export const updateInquiryStatus = createAsyncThunk(
    'inquiries/updateStatus',
    async ({ id, status }: { id: string, status: string }, thunkAPI) => {
        try {
            const { data } = await api.put(`/inquiries/${id}/status`, { status });
            return data.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

const inquirySlice = createSlice({
    name: 'inquiries',
    initialState,
    reducers: {
        resetInquiryState: (state) => {
            state.success = false;
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchInquiries.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchInquiries.fulfilled, (state, action) => {
                state.inquiries = action.payload;
                state.loading = false;
            })
            .addCase(fetchInquiries.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(updateInquiryStatus.fulfilled, (state, action) => {
                state.inquiries = state.inquiries.map(i => i._id === action.payload._id ? action.payload : i);
            });
    }
});

export const { resetInquiryState } = inquirySlice.actions;
export default inquirySlice.reducer;
