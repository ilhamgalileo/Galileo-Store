import { apiSlice } from "./apiSlice";
import { BACKUP_URL } from "../constants";

export const backupApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    backupDatabase: builder.mutation({
      query: () => ({
        url: BACKUP_URL,
        method: "POST",
      }),
    }),
  }),
});

export const { useBackupDatabaseMutation } = backupApiSlice;