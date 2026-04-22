import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../utils/api';

interface UserInfo {
    id: string;
    name: string;
    email: string;
    role: string;
    token: string;
}

interface AuthState {
    userInfo: UserInfo | null;
    loading: boolean;
    error: string | null;
}

const getSafeUserInfo = () => {
    if (typeof window === 'undefined') return null;
    const info = localStorage.getItem('userInfo');
    if (!info || info === 'undefined') return null;
    try {
        return JSON.parse(info);
    } catch (e) {
        return null;
    }
}

const initialState: AuthState = {
    userInfo: getSafeUserInfo(),
    loading: false,
    error: null
};

export const login = createAsyncThunk(
    'auth/login',
    async (credentials: any, thunkAPI) => {
        try {
            const { data } = await api.post('/auth/login', credentials);
            // Backend returns: { success: true, token, user: { id, name, email, role } }
            const userInfo = { ...data.user, token: data.token };
            localStorage.setItem('userInfo', JSON.stringify(userInfo));
            return userInfo;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.error || error.response?.data?.message || error.message);
        }
    }
);

export const registerUser = createAsyncThunk(
    'auth/register',
    async (userData: any, thunkAPI) => {
        try {
            const { data } = await api.post('/auth/register', userData);
            // Backend returns: { success: true, token, user: { id, name, email, role } }
            const userInfo = { ...data.user, token: data.token };
            localStorage.setItem('userInfo', JSON.stringify(userInfo));
            return userInfo;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.error || error.response?.data?.message || error.message);
        }
    }
);

export const logout = createAsyncThunk('auth/logout', async () => {
    localStorage.removeItem('userInfo');
});

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        resetAuthError: (state) => {
            state.error = null;
        },
        updateUserInfo: (state, action: PayloadAction<UserInfo>) => {
            state.userInfo = action.payload;
            localStorage.setItem('userInfo', JSON.stringify(action.payload));
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(login.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.userInfo = action.payload;
                state.loading = false;
            })
            .addCase(login.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(registerUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.userInfo = action.payload;
                state.loading = false;
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(logout.fulfilled, (state) => {
                state.userInfo = null;
            });
    }
});

export const { resetAuthError, updateUserInfo } = authSlice.actions;
export default authSlice.reducer;
