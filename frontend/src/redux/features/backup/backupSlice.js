import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: "",
};

const backupSlice = createSlice({
  name: "backup",
  initialState,
  reducers: {
    backupRequest: (state) => {
      state.isLoading = true;
      state.isSuccess = false;
      state.isError = false;
      state.message = "";
    },
    backupSuccess: (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.message = action.payload;
    },
    backupFail: (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.message = action.payload;
    },
  },
});

export const { backupRequest, backupSuccess, backupFail } = backupSlice.actions;
export default backupSlice.reducer;