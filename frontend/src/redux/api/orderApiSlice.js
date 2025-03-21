import { apiSlice } from "./apiSlice";
import {
  ORDERS_URL,
  MIDTRANS_URL,
  CASH_ORDERS_URL,
  STORE_ORDERS_URL,
} from "../constants";

export const orderApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createOrder: builder.mutation({
      query: (order) => ({
        url: `${ORDERS_URL}/checkout`,
        method: "POST",
        body: order,
      }),
    }),

    createCashOrder: builder.mutation({
      query: (cashOrder) => ({
        url: CASH_ORDERS_URL,
        method: "POST",
        body: cashOrder,
      }),
    }),

    createStoreTransferOrder: builder.mutation({
      query: (storeTransfer) => ({
        url: STORE_ORDERS_URL,
        method: "POST",
        body: storeTransfer,
      }),
    }),

    getOrderDetails: builder.query({
      query: (id) => ({
        url: `${ORDERS_URL}/${id}`,
      }),
    }),

    getCashOrderDetails: builder.query({
      query: (id) => ({
        url: `${CASH_ORDERS_URL}/${id}`,
      }),
    }),

    getStoreOrderDetails: builder.query({
      query: (id) => ({
        url: `${STORE_ORDERS_URL}/${id}`,
      }),
    }),

    payOrder: builder.mutation({
      query: ({ orderId, details }) => ({
        url: `${ORDERS_URL}/${orderId}/pay`,
        method: "PUT",
        body: {
          status: details.status,
          updatedAt: details.updatedAt,
          id: details.id,
          payment_type: details.payment_type,
        },
      }),
    }),

    payOrderStore: builder.mutation({
      query: ({ orderId, details }) => ({
        url: `${STORE_ORDERS_URL}/${orderId}/pay`,
        method: "PUT",
        body: {
          status: details.status,
          updatedAt: details.updatedAt,
          id: details.id,
          payment_type: details.payment_type,
        },
      }),
    }),

    returnOrder: builder.mutation({
      query: ({ orderId, returnedItems }) => ({
        url: `${ORDERS_URL}/${orderId}/return`,
        method: "PUT",
        body: { returnedItems },
      }),
    }),

    returnCashOrder: builder.mutation({
      query: ({ orderId, returnedItems }) => ({
        url: `${CASH_ORDERS_URL}/${orderId}/return`,
        method: "PUT",
        body: { returnedItems },
      }),
    }),

    returnStoreOrder: builder.mutation({
      query: ({ orderId, returnedItems }) => ({
        url: `${STORE_ORDERS_URL}/${orderId}/return`,
        method: "PUT",
        body: { returnedItems },
      }),
    }),

    getMidtransToken: builder.mutation({
      query: (orderId) => ({
        url: `${MIDTRANS_URL}/${orderId}/token`,
        method: "POST",
      }),
    }),

    getMyOrders: builder.query({
      query: () => ({
        url: `${ORDERS_URL}/mine`,
      }),
    }),

    getOrders: builder.query({
      query: () => ({
        url: ORDERS_URL,
      }),
    }),

    getAllOrders: builder.query({
      query: () => ({
        url: `${ORDERS_URL}/all-orders`,
      }),
      transformResponse: (response) => ({
        orders: response.orders || [],
        cashOrders: response.cashOrders || [],
        orderStore: response.orderStore || [],
      }),
    }),

    getCashOrders: builder.query({
      query: () => ({
        url: `${CASH_ORDERS_URL}/all`,
      }),
    }),

    getStoreOrders: builder.query({
      query: () => ({
        url: `${STORE_ORDERS_URL}/all`,
      }),
    }),

    deliverOrder: builder.mutation({
      query: (orderId) => ({
        url: `${ORDERS_URL}/${orderId}/deliver`,
        method: "PUT",
      }),
    }),

    getTotalIncomeCombine: builder.query({
      query: () => `${ORDERS_URL}/total-income-combine`,
    }),

    getTotalIncome: builder.query({
      query: () => `${ORDERS_URL}/total-income`,
    }),

    getTotalIncomeCash: builder.query({
      query: () => `${CASH_ORDERS_URL}/total-income`,
    }),

    getTotalIncomeByDate: builder.query({
      query: () => `${ORDERS_URL}/total-income-by-date`,
    }),

    getTotalIncomeByMonth: builder.query({
      query: () => `${ORDERS_URL}/total-income-by-month`,
    }),

    getTotalIncomeByYear: builder.query({
      query: () => `${ORDERS_URL}/total-income-by-year`,
    }),

    getTotalIncomeByWeek: builder.query({
      query: () => `${ORDERS_URL}/total-income-by-week`,
    }),

    getTotalIncomeCashByDate: builder.query({
      query: () => `${CASH_ORDERS_URL}/total-income-cash-by-date`,
    }),

    getTotalIncomeCashByWeek: builder.query({
      query: () => `${CASH_ORDERS_URL}/total-income-cash-by-week`,
    }),

    getTotalIncomeCashByMonth: builder.query({
      query: () => `${CASH_ORDERS_URL}/total-income-cash-by-month`,
    }),

    getTotalIncomeCashByYear: builder.query({
      query: () => `${CASH_ORDERS_URL}/total-income-cash-by-year`,
    }),

    getTotalOrder: builder.query({
      query: () => `${ORDERS_URL}/total-orders`,
    }),

    getTotalSales: builder.query({
      query: () => `${ORDERS_URL}/total-sales`,
    }),

    getTotalSalesByDate: builder.query({
      query: () => `${ORDERS_URL}/total-sales-by-date`,
    }),

    getTotalSalesByMonth: builder.query({
      query: () => `${ORDERS_URL}/total-sales-by-month`,
    }),

    getTotalSalesByYear: builder.query({
      query: () => `${ORDERS_URL}/total-sales-by-year`,
    }),

    getTotalSalesByWeek: builder.query({
      query: () => `${ORDERS_URL}/total-sales-by-week`,
    }),

    getTotalIncomeStoreByDate: builder.query({
      query: () => `${STORE_ORDERS_URL}/total-income-store-by-date`,
    }),

    getTotalIncomeStoreByWeek: builder.query({
      query: () => `${STORE_ORDERS_URL}/total-income-store-by-week`,
    }),

    getTotalIncomeStoreByMonth: builder.query({
      query: () => `${STORE_ORDERS_URL}/total-income-store-by-month`,
    }),

    getTotalIncomeStoreByYear: builder.query({
      query: () => `${STORE_ORDERS_URL}/total-income-store-by-year`,
    }),

    getMemberByEmail: builder.query({
      query: (email) => `${CASH_ORDERS_URL}/${email}/membership`,
    }),

    getIncome: builder.query({
      query: () => `${ORDERS_URL}/total-income`,
    }),
  }),
});

export const {
  useCreateOrderMutation,
  useCreateCashOrderMutation,
  useCreateStoreTransferOrderMutation,
  useDeliverOrderMutation,
  useGetMyOrdersQuery,
  useGetMidtransTokenMutation,
  useGetOrderDetailsQuery,
  useGetStoreOrderDetailsQuery,
  useGetStoreOrdersQuery,
  useGetCashOrderDetailsQuery,
  useGetCashOrdersQuery,
  useGetTotalIncomeCombineQuery,
  useGetTotalIncomeQuery,
  useGetTotalIncomeCashQuery,
  useGetTotalIncomeByDateQuery,
  useGetTotalIncomeByMonthQuery,
  useGetTotalIncomeByYearQuery, 
  useGetTotalIncomeByWeekQuery,
  useGetTotalIncomeCashByDateQuery,
  useGetTotalIncomeCashByMonthQuery,
  useGetTotalIncomeCashByWeekQuery,
  useGetTotalIncomeCashByYearQuery,
  useGetTotalIncomeStoreByDateQuery,
  useGetTotalIncomeStoreByMonthQuery,
  useGetTotalIncomeStoreByWeekQuery,
  useGetTotalIncomeStoreByYearQuery,
  useGetOrdersSalesByDateQuery,
  useGetTotalOrderQuery,
  useGetTotalSalesQuery,
  useGetTotalSalesByDateQuery,
  useGetTotalSalesByMonthQuery,
  useGetTotalSalesByWeekQuery,
  useGetTotalSalesByYearQuery,
  usePayOrderMutation,
  usePayOrderStoreMutation,
  useReturnOrderMutation,
  useReturnStoreOrderMutation,
  useGetOrdersQuery,
  useGetAllOrdersQuery,
  useGetMemberByEmailQuery,
  useReturnCashOrderMutation,
  useGetIncomeQuery,
} = orderApiSlice;
