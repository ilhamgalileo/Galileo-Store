import { apiSlice } from "./apiSlice";
import { BASE_URL, USERS_URL } from "../constants";

export const userApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (data) => ({
        url: `${USERS_URL}/auth`,
        method: "POST",
        body: data,
      }),
    }),

    logout: builder.mutation({
      query: () => ({
        url: `${USERS_URL}/logout`,
        method: "POST",
      }),
    }),

    Register: builder.mutation({
      query: (data) => ({
        url: `${USERS_URL}/register`,
        method: "POST",
        body: data,
      }),
    }),

    AddAdmin: builder.mutation({
      query: (data) => ({
        url: `${USERS_URL}/add-admin`,
        method: "POST",
        body: data,
      }),
    }),

    Profile: builder.mutation({
      query: (data) => ({
        url: `${USERS_URL}/profile`,
        method: "PUT",
        body: data,

      }),
    }),

    getUsers: builder.query({
      query: () => `${USERS_URL}`,
      providesTags: ['User'],
    }),

    getUserCount: builder.query({
      query: () => `${USERS_URL}/count`,
    }),

    deleteUser: builder.mutation({
      query: (userId) => ({
        url: `${USERS_URL}/${userId}`,
        method: "DELETE",
      }),
    }),

    markUserAsAdmin: builder.mutation({
      query: (userId) => ({
        url: `${USERS_URL}/${userId}/as-admin`,
        method: "PUT",
      }),
    }),

    getUserDetails: builder.query({
      query: (id) => ({
        url: `${BASE_URL}api/users/${id}`,
      }),
      keepUnusedDataFor: 5,
    }),

    getUserProfile: builder.query({
      query: () => ({
        url: `${BASE_URL}api/users/profile`,
      }),
      keepUnusedDataFor: 5,
    }),

    updateUser: builder.mutation({
      query: (data) =>({
        url:`${BASE_URL}/api/users/${data.userId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ["User"], 
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useRegisterMutation,
  useAddAdminMutation,
  useProfileMutation,
  useGetUserCountQuery,
  useGetUsersQuery,
  useDeleteUserMutation,
  useGetUserDetailsQuery,
  useUpdateUserMutation,
  useGetUserProfileQuery,
  useMarkUserAsAdminMutation
} = userApiSlice