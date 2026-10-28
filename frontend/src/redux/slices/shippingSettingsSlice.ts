import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../utils/api';
import { normalizeShippingSettings, type ShippingSettingsData } from '../../utils/shipping';

export type { ShippingSettingsData, RateSlab, CountryRate } from '../../utils/shipping';

export interface ShippingSettingsPayload {
    homeState: string;
    withinState: ShippingSettingsData['withinState'];
    otherStates: ShippingSettingsData['otherStates'];
    international: ShippingSettingsData['international'];
    countryRates: ShippingSettingsData['countryRates'];
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

interface ShippingSettingsState {
    settings: ShippingSettingsData;
    loaded: boolean;
    loading: boolean;
    saving: boolean;
    error: string | null;
    fetchError: string | null;
    success: boolean;
}

const initialState: ShippingSettingsState = {
    settings: normalizeShippingSettings(null),
    loaded: false,
    loading: false,
    saving: false,
    error: null,
    fetchError: null,
    success: false
};

export const fetchShippingSettings = createAsyncThunk(
    'shippingSettings/fetch',
    async (_, thunkAPI) => {
        try {
            const { data } = await api.get('/shipping-settings');
            return data.data as ShippingSettingsData;
        } catch (error: unknown) {
            return thunkAPI.rejectWithValue(getRequestError(error));
        }
    }
);

export const updateShippingSettings = createAsyncThunk(
    'shippingSettings/update',
    async (payload: ShippingSettingsPayload, thunkAPI) => {
        try {
            const { data } = await api.put('/shipping-settings', payload);
            return data.data as ShippingSettingsData;
        } catch (error: unknown) {
            return thunkAPI.rejectWithValue(getRequestError(error));
        }
    }
);

const shippingSettingsSlice = createSlice({
    name: 'shippingSettings',
    initialState,
    reducers: {
        resetShippingSettingsState: (state) => {
            state.error = null;
            state.fetchError = null;
            state.success = false;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchShippingSettings.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.fetchError = null;
            })
            .addCase(fetchShippingSettings.fulfilled, (state, action) => {
                state.settings = normalizeShippingSettings(action.payload);
                state.loading = false;
                state.loaded = true;
                state.fetchError = null;
            })
            .addCase(fetchShippingSettings.rejected, (state, action) => {
                state.loading = false;
                state.loaded = true;
                state.fetchError = action.payload as string;
            })
            .addCase(updateShippingSettings.pending, (state) => {
                state.saving = true;
                state.error = null;
                state.success = false;
            })
            .addCase(updateShippingSettings.fulfilled, (state, action) => {
                state.settings = normalizeShippingSettings(action.payload);
                state.saving = false;
                state.error = null;
                state.success = true;
            })
            .addCase(updateShippingSettings.rejected, (state, action) => {
                state.saving = false;
                state.error = action.payload as string;
            });
    }
});

export const { resetShippingSettingsState } = shippingSettingsSlice.actions;
export default shippingSettingsSlice.reducer;
