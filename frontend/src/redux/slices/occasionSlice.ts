import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export interface OccasionItem {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    metaDescription?: string;
    image?: string;
    parent?: string | { _id: string; name: string; slug: string } | null;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

interface OccasionState {
    occasions: OccasionItem[];
    loading: boolean;
    error: string | null;
    success: boolean;
}

const initialState: OccasionState = {
    occasions: [],
    loading: false,
    error: null,
    success: false
};

export const fetchOccasions = createAsyncThunk(
    'occasions/fetchAll',
    async (_, thunkAPI) => {
        try {
            const { data } = await api.get('/occasions');
            return data.data as OccasionItem[];
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.error || error.response?.data?.message || error.message);
        }
    }
);

export const createOccasion = createAsyncThunk(
    'occasions/create',
    async (formData: FormData, thunkAPI) => {
        try {
            const { data } = await api.post('/occasions', formData);
            return data.data as OccasionItem;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.error || error.response?.data?.message || error.message);
        }
    }
);

export const updateOccasion = createAsyncThunk(
    'occasions/update',
    async ({ id, formData }: { id: string; formData: FormData }, thunkAPI) => {
        try {
            const { data } = await api.put(`/occasions/${id}`, formData);
            return data.data as OccasionItem;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.error || error.response?.data?.message || error.message);
        }
    }
);

export const deleteOccasion = createAsyncThunk(
    'occasions/delete',
    async (id: string, thunkAPI) => {
        try {
            await api.delete(`/occasions/${id}`);
            return id;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

const occasionSlice = createSlice({
    name: 'occasions',
    initialState,
    reducers: {
        resetOccasionState: (state) => {
            state.success = false;
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchOccasions.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchOccasions.fulfilled, (state, action) => {
                state.occasions = action.payload;
                state.loading = false;
            })
            .addCase(fetchOccasions.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(createOccasion.fulfilled, (state, action) => {
                state.occasions.unshift(action.payload);
                state.success = true;
            })
            .addCase(updateOccasion.fulfilled, (state, action) => {
                state.occasions = state.occasions.map(o => o._id === action.payload._id ? action.payload : o);
                state.success = true;
            })
            .addCase(deleteOccasion.fulfilled, (state, action) => {
                state.occasions = state.occasions.filter(o => o._id !== action.payload && !(typeof o.parent === 'object' && o.parent && o.parent._id === action.payload));
            });
    }
});

export const { resetOccasionState } = occasionSlice.actions;
export default occasionSlice.reducer;