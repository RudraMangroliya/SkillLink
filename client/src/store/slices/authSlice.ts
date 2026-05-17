import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  user: any | null;
  token: string | null;
  isAuthenticated: boolean;
  profileComplete: boolean | null;
}

const initialState: AuthState = {
  user: localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") as string) : null,
  token: localStorage.getItem("token") || null, // Fallback for browsers that block 3rd party cookies
  isAuthenticated: !!localStorage.getItem("user"),
  profileComplete: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: any; token: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.profileComplete = action.payload.user.profileComplete ?? null;
      localStorage.setItem("user", JSON.stringify(action.payload.user));
      if (action.payload.token) {
        localStorage.setItem("token", action.payload.token);
      }
    },
    setProfileComplete: (state, action: PayloadAction<boolean>) => {
      state.profileComplete = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.profileComplete = null;
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    },
  },
});

export const { setCredentials, logout, setProfileComplete } = authSlice.actions;
export default authSlice.reducer;
