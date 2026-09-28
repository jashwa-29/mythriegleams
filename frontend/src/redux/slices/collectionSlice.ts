import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export interface CollectionItem {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    metaDescription?: string;
    image?: string;
    parent?: string | { _id: string; name: string; slug: string } | null;
    isActive?: boolean;
    /** Paused collections stay in the nav, but their products are hidden from the storefront. */
    isPaused?: boolean;
    pausedAt?: string;
    /** True when this section is unsellable because it, or an ancestor, is paused. */
    isEffectivelyPaused?: boolean;
    /** Name of the section that carries the pause when it is an ancestor. */
    pausedBecause?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

interface CollectionState {
    collections: CollectionItem[];
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
    async (options: { all?: boolean } | undefined, thunkAPI) => {
        try {
            // ?all=true is honoured server-side only for admins; it also returns deactivated
            // collections so the admin screen can bring them back.
            const { data } = await api.get('/collections', {
                params: options?.all ? { all: 'true' } : undefined
            });
            return data.data as CollectionItem[];
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.error || error.response?.data?.message || error.message);
        }
    }
);

/**
 * Pause / resume a collection. Pausing hides every product in that collection (and in its
 * sub-collections) from the storefront, cart and checkout.
 */
export const setCollectionPause = createAsyncThunk(
    'collections/setPause',
    async ({ id, isPaused }: { id: string; isPaused: boolean }, thunkAPI) => {
        try {
            const { data } = await api.put(`/collections/${id}/pause`, { isPaused });
            return { item: data.data as CollectionItem, message: data.message as string };
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
            return data.data as CollectionItem;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.error || error.response?.data?.message || error.message);
        }
    }
);

export const updateCollection = createAsyncThunk(
    'collections/update',
    async ({ id, formData }: { id: string; formData: FormData }, thunkAPI) => {
        try {
            const { data } = await api.put(`/collections/${id}`, formData);
            return data.data as CollectionItem;
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
            .addCase(updateCollection.fulfilled, (state, action) => {
                state.collections = state.collections.map(c => c._id === action.payload._id ? action.payload : c);
                state.success = true;
            })
            .addCase(deleteCollection.fulfilled, (state, action) => {
                state.collections = state.collections.filter(c => c._id !== action.payload && !(typeof c.parent === 'object' && c.parent && c.parent._id === action.payload));
            })
            // No `success`/`error` flag here on purpose: the page reports the outcome itself so
            // pausing does not close the add/edit modal.
            .addCase(setCollectionPause.fulfilled, (state, action) => {
                state.collections = state.collections.map(c =>
                    c._id === action.payload.item._id ? action.payload.item : c
                );
            });
    }
});

export const { resetCollectionState } = collectionSlice.actions;
export default collectionSlice.reducer;