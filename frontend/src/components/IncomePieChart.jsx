import React, { useState } from "react";
import Chart from "react-apexcharts";
import {
  useGetTotalIncomeByDateQuery,
  useGetTotalIncomeByWeekQuery,
  useGetTotalIncomeByMonthQuery,
  useGetTotalIncomeByYearQuery,
  useGetTotalIncomeCombineQuery,
  useGetTotalIncomeCashByDateQuery,
  useGetTotalIncomeCashByWeekQuery,
  useGetTotalIncomeCashByMonthQuery,
  useGetTotalIncomeCashByYearQuery,
  useGetTotalIncomeStoreByDateQuery,
  useGetTotalIncomeStoreByMonthQuery,
  useGetTotalIncomeStoreByYearQuery,
  useGetTotalIncomeStoreByWeekQuery,
} from "../redux/api/orderApiSlice";

const IncomePieChart = () => {
  const [timeRange, setTimeRange] = useState("totalCombineIncome");
  const [paymentMethod, setPaymentMethod] = useState("all");

  const { data: incomeCashByDate } = useGetTotalIncomeCashByDateQuery();
  const { data: incomeCashByWeek } = useGetTotalIncomeCashByWeekQuery();
  const { data: incomeCashByMonth } = useGetTotalIncomeCashByMonthQuery();
  const { data: incomeCashByYear } = useGetTotalIncomeCashByYearQuery();

  const { data: incomeOrderByDate } = useGetTotalIncomeByDateQuery();
  const { data: incomeOrderByWeek } = useGetTotalIncomeByWeekQuery();
  const { data: incomeOrderByMonth } = useGetTotalIncomeByMonthQuery();
  const { data: incomeOrderByYear } = useGetTotalIncomeByYearQuery();

  const { data: incomeStoreByDate } = useGetTotalIncomeStoreByDateQuery();
  const { data: incomeStoreByMonth } = useGetTotalIncomeStoreByMonthQuery();
  const { data: incomeStoreByYear } = useGetTotalIncomeStoreByYearQuery();
  const { data: incomeStoreByWeek } = useGetTotalIncomeStoreByWeekQuery();

  const { data: totalCombineIncome } = useGetTotalIncomeCombineQuery();

  const formatRupiah = (value) => `Rp${value.toLocaleString("id-ID")}`;

  const getIncomeData = () => {
    switch (timeRange) {
      case "daily":
        if (paymentMethod === "cash") {
          return incomeCashByDate ? incomeCashByDate.map((item) => item.totalProfit) : [0];
        } else if (paymentMethod === "order") {
          return incomeOrderByDate ? incomeOrderByDate.map((item) => item.totalProfit) : [0];
        } else if (paymentMethod === "store") {
          return incomeStoreByDate ? incomeStoreByDate.map((item) => item.totalProfit) : [0];
        } else {
          return [
            incomeCashByDate?.reduce((sum, item) => sum + item.totalProfit, 0) || 0,
            incomeOrderByDate?.reduce((sum, item) => sum + item.totalProfit, 0) || 0,
            incomeStoreByDate?.reduce((sum, item) => sum + item.totalProfit, 0) || 0,
          ];
        }
      case "weekly":
        if (paymentMethod === "cash") {
          return incomeCashByWeek ? incomeCashByWeek.map((item) => item.totalProfit) : [0];
        } else if (paymentMethod === "order") {
          return incomeOrderByWeek ? incomeOrderByWeek.map((item) => item.totalProfit) : [0];
        } else if (paymentMethod === "store") {
          return incomeStoreByWeek ? incomeStoreByWeek.map((item) => item.totalProfit) : [0];
        } else {
          return [
            incomeCashByWeek?.reduce((sum, item) => sum + item.totalProfit, 0) || 0,
            incomeOrderByWeek?.reduce((sum, item) => sum + item.totalProfit, 0) || 0,
            incomeStoreByWeek?.reduce((sum, item) => sum + item.totalProfit, 0) || 0,
          ];
        }
      case "monthly":
        if (paymentMethod === "cash") {
          return incomeCashByMonth ? incomeCashByMonth.map((item) => item.totalProfit) : [0];
        } else if (paymentMethod === "order") {
          return incomeOrderByMonth ? incomeOrderByMonth.map((item) => item.totalProfit) : [0];
        } else if (paymentMethod === "store") {
          return incomeStoreByMonth ? incomeStoreByMonth.map((item) => item.totalProfit) : [0];
        } else {
          return [
            incomeCashByMonth?.reduce((sum, item) => sum + item.totalProfit, 0) || 0,
            incomeOrderByMonth?.reduce((sum, item) => sum + item.totalProfit, 0) || 0,
            incomeStoreByMonth?.reduce((sum, item) => sum + item.totalProfit, 0) || 0,
          ];
        }
      case "yearly":
        if (paymentMethod === "cash") {
          return incomeCashByYear ? incomeCashByYear.map((item) => item.totalProfit) : [0];
        } else if (paymentMethod === "order") {
          return incomeOrderByYear ? incomeOrderByYear.map((item) => item.totalProfit) : [0];
        } else if (paymentMethod === "store") {
          return incomeStoreByYear ? incomeStoreByYear.map((item) => item.totalProfit) : [0];
        } else {
          return [
            incomeCashByYear?.reduce((sum, item) => sum + item.totalProfit, 0) || 0,
            incomeOrderByYear?.reduce((sum, item) => sum + item.totalProfit, 0) || 0,
            incomeStoreByYear?.reduce((sum, item) => sum + item.totalProfit, 0) || 0,
          ];
        }
      case "totalCombineIncome":
        return totalCombineIncome
          ? [totalCombineIncome.order, totalCombineIncome.cash, totalCombineIncome.store]
          : [0, 0, 0];
      default:
        return [0];
    }
  };

  const getLabels = () => {
    switch (timeRange) {
      case "daily":
        if (paymentMethod === "cash") {
          return incomeCashByDate?.map((item) => item._id) || ["No Data"];
        } else if (paymentMethod === "order") {
          return incomeOrderByDate?.map((item) => item._id) || ["No Data"];
        } else if (paymentMethod === "store") {
          return incomeStoreByDate?.map((item) => item._id) || ["No Data"];
        } else {
          return ["Cash", "Order", "Store"];
        }
      case "weekly":
        if (paymentMethod === "cash") {
          return incomeCashByWeek?.map((item) => `Week ${item._id?.week}`) || ["No Data"];
        } else if (paymentMethod === "order") {
          return incomeOrderByWeek?.map((item) => `Week ${item._id?.week}`) || ["No Data"];
        } else if (paymentMethod === "store") {
          return incomeStoreByWeek?.map((item) => `Week ${item._id?.week}`) || ["No Data"]
        } else {
          return ["Cash", "Order", "Store"];
        }
      case "monthly":
        if (paymentMethod === "cash") {
          return incomeCashByMonth?.map((item) => item._id) || ["No Data"];
        } else if (paymentMethod === "order") {
          return incomeOrderByMonth?.map((item) => item._id) || ["No Data"];
        } else if (paymentMethod === "store") {
          return incomeStoreByMonth?.map((item) => item._id) || ["No Data"];
        } else {
          return ["Cash", "Order", "Store"];
        }
      case "yearly":
        if (paymentMethod === "cash") {
          return incomeCashByYear?.map((item) => item._id) || ["No Data"];
        } else if (paymentMethod === "order") {
          return incomeOrderByYear?.map((item) => item._id) || ["No Data"];
        } else if (paymentMethod === "store") {
          return incomeStoreByYear?.map((item) => item._id) || ["No Data"];
        } else {
          return ["Cash", "Order", "Store"];
        }
      case "totalCombineIncome":
        return ["Order", "Cash", "Store"];
      default:
        return ["Total Income"];
    }
  };

  const pieChartConfig = {
    options: {
      chart: {
        type: "pie",
      },
      labels: getLabels(),
      colors: ["#f97316", "#10b981", "#3b82f6", "#ef4444", "#a855f7"],
      legend: {
        labels: {
          colors: "#ffffff",
        },
      },
      tooltip: {
        y: {
          formatter: (value) => formatRupiah(value),
        },
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 200,
            },
            legend: {
              position: "bottom",
            },
          },
        },
      ],
    },
    series: getIncomeData(),
  };

  return (
    <div className="bg-neutral-800 rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">Income Distribution</h2>
        <div className="flex gap-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-gray-700 text-white rounded-lg p-2"
          >
            <option value="totalCombineIncome">Total Combined Income</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="bg-gray-700 text-white rounded-lg p-2"
          >
            <option value="all">All Methods</option>
            <option value="cash">Cash</option>
            <option value="order">Order</option>
            <option value="store">Store</option>
          </select>
        </div>
      </div>
      <Chart
        options={pieChartConfig.options}
        series={getIncomeData()}
        type="pie"
        height={350}
      />
    </div>
  );
};

export default IncomePieChart;