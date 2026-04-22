import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

interface ProductState {
    products: any[];
    selectedProduct: any | null; // Single product for detail page
    loading: boolean;
    error: string | null;
    success: boolean;
    deleteSuccess: boolean;
}

const initialState: ProductState = {
    products: [],
    selectedProduct: null,
    loading: false,
    error: null,
    success: false,
    deleteSuccess: false
};

// Fetch Single Product by Slug
export const fetchProductBySlug = createAsyncThunk(
    'products/fetchBySlug',
    async (slug: string, thunkAPI) => {
        try {
            const { data } = await api.get(`/products/${slug}`);
            return data.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.error || error.response?.data?.message || error.message);
        }
    }
);

// Fetch All Products (Admin / User)
export const fetchProducts = createAsyncThunk(
    'products/fetchAll',
    async (params: any, thunkAPI) => {
        try {
            const { data } = await api.get('/products', { params });
            return data.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.error || error.response?.data?.message || error.message);
        }
    }
);

// Create Product (Admin Only)
export const createProduct = createAsyncThunk(
    'products/create',
    async (productData: any, thunkAPI) => {
        try {
            const { data } = await api.post('/products', productData);
            return data.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.error || error.response?.data?.message || error.message);
        }
    }
);

// Delete Product (Admin Only)
export const deleteProduct = createAsyncThunk(
    'products/delete',
    async (id: string, thunkAPI) => {
        try {
            await api.delete(`/products/${id}`);
            return id;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.error || error.response?.data?.message || error.message);
        }
    }
);

// Update Product (Admin Only)
export const updateProduct = createAsyncThunk(
    'products/update',
    async ({ id, productData }: { id: string, productData: any }, thunkAPI) => {
        try {
            const { data } = await api.put(`/products/${id}`, productData);
            return data.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.error || error.response?.data?.message || error.message);
        }
    }
);

const productSlice = createSlice({
    name: 'products',
    initialState,
    reducers: {
        resetProductState: (state) => {
            state.success = false;
            state.deleteSuccess = false;
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchProductBySlug.pending, (state) => {
                state.loading = true;
                state.selectedProduct = null;
            })
            .addCase(fetchProductBySlug.fulfilled, (state, action) => {
                state.selectedProduct = action.payload;
                state.loading = false;
            })
            .addCase(fetchProductBySlug.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(fetchProducts.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchProducts.fulfilled, (state, action) => {
                state.products = action.payload;
                state.loading = false;
            })
            .addCase(fetchProducts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(createProduct.pending, (state) => {
                state.loading = true;
            })
            .addCase(createProduct.fulfilled, (state, action) => {
                state.success = true;
                state.products.push(action.payload);
                state.loading = false;
            })
            .addCase(updateProduct.pending, (state) => {
                state.loading = true;
            })
            .addCase(updateProduct.fulfilled, (state, action) => {
                state.success = true;
                const index = state.products.findIndex(p => p._id === action.payload._id);
                if (index !== -1) {
                    state.products[index] = action.payload;
                }
                state.loading = false;
            })
            .addCase(updateProduct.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(deleteProduct.fulfilled, (state, action) => {
                state.deleteSuccess = true;
                state.products = state.products.filter(p => p._id !== action.payload);
            });
    }
});

export const { resetProductState } = productSlice.actions;
export default productSlice.reducer;
