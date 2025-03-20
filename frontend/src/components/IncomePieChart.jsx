import React, { useState } from "react";
import Chart from "react-apexcharts";
import {
  useGetTotalIncomeQuery,
  useGetTotalIncomeByDateQuery,
  useGetTotalIncomeByWeekQuery,
  useGetTotalIncomeByMonthQuery,
  useGetTotalIncomeByYearQuery,
} from "../redux/api/orderApiSlice";

const IncomePieChart = () => {
  const [timeRange, setTimeRange] = useState("daily");

  const {
    data: totalIncome,
    isLoading: isLoadingTotalIncome,
  } = useGetTotalIncomeQuery();
  const {
    data: incomeByDate,
    isLoading: isLoadingIncomeByDate,
  } = useGetTotalIncomeByDateQuery();
  const {
    data: incomeByWeek,
    isLoading: isLoadingIncomeByWeek,
  } = useGetTotalIncomeByWeekQuery();
  const {
    data: incomeByMonth,
    isLoading: isLoadingIncomeByMonth,
  } = useGetTotalIncomeByMonthQuery();
  const {
    data: incomeByYear,
    isLoading: isLoadingIncomeByYear,
  } = useGetTotalIncomeByYearQuery();

  if (
    isLoadingTotalIncome ||
    isLoadingIncomeByDate ||
    isLoadingIncomeByWeek ||
    isLoadingIncomeByMonth ||
    isLoadingIncomeByYear
  ) {
    return <div>Loading...</div>;
  }

  const formatRupiah = (value) => {
    return `Rp${value.toLocaleString("id-ID")}`;
  };

  const getIncomeData = () => {
    switch (timeRange) {
      case "daily":
        return incomeByDate ? incomeByDate.map((item) => item.totalProfit) : [0];
      case "weekly":
        return incomeByWeek ? incomeByWeek.map((item) => item.totalProfit) : [0];
      case "monthly":
        return incomeByMonth ? incomeByMonth.map((item) => item.totalProfit) : [0];
      case "yearly":
        return incomeByYear ? incomeByYear.map((item) => item.totalProfit) : [0];
      default:
        return totalIncome ? [totalIncome.totalProfit] : [0];
    }
  };

  const pieChartConfig = {
    options: {
      chart: {
        type: "pie",
      },
      labels:
        timeRange === "daily"
          ? incomeByDate?.map((item) => item._id) || ["No Data"]
          : timeRange === "weekly"
          ? incomeByWeek?.map((item) => `Week ${item._id?.week}`) || ["No Data"]
          : timeRange === "monthly"
          ? incomeByMonth?.map((item) => item._id) || ["No Data"]
          : timeRange === "yearly"
          ? incomeByYear?.map((item) => item._id) || ["No Data"]
          : ["Total Income"],
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
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="bg-gray-700 text-white rounded-lg p-2"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>
      <Chart
        options={pieChartConfig.options}
        series={pieChartConfig.series}
        type="pie"
        height={350}
      />
    </div>
  );
};

export default IncomePieChart;