import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/v1/auth` ;

// Helper to set headers
const getHeaders = (token) => ({
  'Content-Type': 'application/json',
  ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
});

// Async Thunks
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async ({ name, email, password }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_URL}/signup`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return rejectWithValue(data.message || 'Registration failed');
      }
      return data;
    } catch (err) {
      return rejectWithValue('Network error, please try again');
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return rejectWithValue(data.message || 'Login failed');
      }
      return data;
    } catch (err) {
      return rejectWithValue('Network error, please try again');
    }
  }
);

export const checkAuthUser = createAsyncThunk(
  'auth/checkAuthUser',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token || localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('No token found');
      }

      const res = await fetch(`${API_URL}/me`, {
        method: 'GET',
        headers: getHeaders(token),
      });

      const data = await res.json();
      if (!res.ok) {
        return rejectWithValue(data.message || 'Auth check failed');
      }
      return { user: data, token };
    } catch (err) {
      return rejectWithValue('Network error during auth check');
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'auth/updateUserProfile',
  async ({ name, password }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token || localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('Authorization denied');
      }

      const res = await fetch(`${API_URL}/profile`, {
        method: 'PUT',
        headers: getHeaders(token),
        body: JSON.stringify({ name, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return rejectWithValue(data.message || 'Profile update failed');
      }
      return data.user;
    } catch (err) {
      return rejectWithValue('Network error, please try again');
    }
  }
);

// Initial State
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: true,
  error: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem('token');
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem('token', action.payload.token);
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem('token', action.payload.token);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Check Auth
      .addCase(checkAuthUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuthUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(checkAuthUser.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        localStorage.removeItem('token');
      })
      // Update Profile
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
