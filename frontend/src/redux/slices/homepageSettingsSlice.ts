import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../utils/api';

export interface HomepageSettingsReference {
    _id: string;
    name: string;
    slug: string;
    parent?: string | HomepageSettingsReference | null;
    isActive?: boolean;
}

export type HomepageSettingsReferenceValue = string | HomepageSettingsReference | null;

export interface HomepageSettings {
    _id: string;
    key: string;
    seasonalSection: {
        enabled: boolean;
        collectionIds: HomepageSettingsReferenceValue[];
        occasionIds: HomepageSettingsReferenceValue[];
    };
    createdAt?: string;
    updatedAt?: string;
}

export interface HomepageSettingsPayload {
    enabled: boolean;
    collectionIds: string[];
    occasionIds: string[];
}

type RequestError = {
    response?: {
        data?: {
            error?: string;
            message?: string;
        };
    };
};

const getRequestError = (error: unknown) => {
    if (typeof error === 'object' && error !== null && 'response' in error) {
        const response = (error as RequestError).response;
        if (response?.data?.error) return response.data.error;
        if (response?.data?.message) return response.data.message;
    }
    return error instanceof Error ? error.message : 'The request could not be completed.';
};

interface HomepageSettingsState {
    settings: HomepageSettings | null;
    loaded: boolean;
    loading: boolean;
    saving: boolean;
    error: string | null;
    fetchError: string | null;
    success: boolean;
}

const initialState: HomepageSettingsState = {
    settings: null,
    loaded: false,
    loading: false,
    saving: false,
    error: null,
    fetchError: null,
    success: false
};

export const fetchHomepageSettings = createAsyncThunk(
    'homepageSettings/fetch',
    async (_, thunkAPI) => {
        try {
            const { data } = await api.get('/homepage-settings');
            return data.data as HomepageSettings | null;
        } catch (error: unknown) {
            return thunkAPI.rejectWithValue(getRequestError(error));
        }
    }
);

export const updateHomepageSettings = createAsyncThunk(
    'homepageSettings/update',
    async (payload: HomepageSettingsPayload, thunkAPI) => {
        try {
            const { data } = await api.put('/homepage-settings', payload);
            return data.data as HomepageSettings;
        } catch (error: unknown) {
            return thunkAPI.rejectWithValue(getRequestError(error));
        }
    }
);

const homepageSettingsSlice = createSlice({
    name: 'homepageSettings',
    initialState,
    reducers: {
        resetHomepageSettingsState: (state) => {
            state.error = null;
            state.fetchError = null;
            state.success = false;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchHomepageSettings.pending, (state) => {
                state.loading = true;
                state.loaded = false;
                state.error = null;
                state.fetchError = null;
            })
            .addCase(fetchHomepageSettings.fulfilled, (state, action) => {
                state.settings = action.payload;
                state.loading = false;
                state.loaded = true;
                state.error = null;
                state.fetchError = null;
            })
            .addCase(fetchHomepageSettings.rejected, (state, action) => {
                state.loading = false;
                state.loaded = true;
                state.fetchError = action.payload as string;
            })
            .addCase(updateHomepageSettings.pending, (state) => {
                state.saving = true;
                state.error = null;
                state.success = false;
            })
            .addCase(updateHomepageSettings.fulfilled, (state, action) => {
                state.settings = action.payload;
                state.saving = false;
                state.error = null;
                state.success = true;
            })
            .addCase(updateHomepageSettings.rejected, (state, action) => {
                state.saving = false;
                state.error = action.payload as string;
            });
    }
});

export const { resetHomepageSettingsState } = homepageSettingsSlice.actions;
export default homepageSettingsSlice.reducer;
