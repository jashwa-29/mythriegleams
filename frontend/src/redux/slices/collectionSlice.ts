import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

interface CollectionState {
    collections: any[];
    loading: boolean;
    error: string | null;
    success: boolean;
}

const initialState: CollectionState = {
    collections: [],
    loading: false,
    error: null,
    success: false
};

export const fetchCollections = createAsyncThunk(
    'collections/fetchAll',
    async (_, thunkAPI) => {
        try {
            const { data } = await api.get('/collections');
            return data.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.error || error.response?.data?.message || error.message);
        }
    }
);

export const createCollection = createAsyncThunk(
    'collections/create',
    async (formData: FormData, thunkAPI) => {
        try {
            const { data } = await api.post('/collections', formData);
            return data.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.error || error.response?.data?.message || error.message);
        }
    }
);

export const deleteCollection = createAsyncThunk(
    'collections/delete',
    async (id: string, thunkAPI) => {
        try {
            await api.delete(`/collections/${id}`);
            return id;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

const collectionSlice = createSlice({
    name: 'collections',
    initialState,
    reducers: {
        resetCollectionState: (state) => {
            state.success = false;
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCollections.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchCollections.fulfilled, (state, action) => {
                state.collections = action.payload;
                state.loading = false;
            })
            .addCase(fetchCollections.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(createCollection.fulfilled, (state, action) => {
                state.collections.unshift(action.payload);
                state.success = true;
            })
            .addCase(deleteCollection.fulfilled, (state, action) => {
                state.collections = state.collections.filter(c => c._id !== action.payload);
            });
    }
});

export const { resetCollectionState } = collectionSlice.actions;
export default collectionSlice.reducer;
