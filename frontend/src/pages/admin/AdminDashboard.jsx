// AdminDashboard.jsx
import { useState, useEffect } from "react";
import Chart from "react-apexcharts";
import {
  useGetUserCountQuery,
} from "../../redux/api/usersApiSlice";
import {
  useGetTotalSalesQuery,
  useGetTotalOrderQuery,
  useGetTotalSalesByDateQuery,
  useGetTotalSalesByWeekQuery,
  useGetTotalSalesByMonthQuery,
  useGetTotalSalesByYearQuery,
  useGetTotalIncomeCombineQuery
} from "../../redux/api/orderApiSlice";
import OrderList from "./OrderList";
import Loader from "../../components/loader";
import { toast } from 'react-toastify'
import { useBackupDatabaseMutation } from "../../redux/api/backupApiSlice";
import { FaUser, FaShoppingBag, FaChartLine, FaCalendar, FaCalendarAlt, FaMoneyBillAlt, FaMoneyBillWave } from "react-icons/fa";
import IncomePieChart from "../../components/IncomePieChart";

const StatBox = ({ title, value, icon, loading }) => (
  <div className="rounded-lg bg-neutral-700 shadow-lg p-6 w-full">
    <div className="flex items-center justify-between">
      <div className="font-bold rounded-full w-12 h-12 bg-orange-500 flex items-center justify-center text-gray-100">
        {icon}
      </div>
    </div>
    <div className="mt-4">
      <p className="text-white text-sm font-medium ">{title}</p>
      <h1 className="text-2xl font-bold text-white mt-[1rem]">
        {loading ? <Loader /> : value}
      </h1>
    </div>
  </div>
);

const generateAllWeeksInMonth = (month) => {
  const weeks = []
  const year = new Date().getFullYear()
  const firstDayOfMonth = new Date(year, month - 1, 1)
  const lastDayOfMonth = new Date(year, month, 0)

  let currentDate = new Date(firstDayOfMonth);
  while (currentDate <= lastDayOfMonth) {
    const weekNumber = Math.ceil(currentDate.getDate() / 7)
    const weekId = `${year}-${month.toString().padStart(2, "0")}-${weekNumber}`
    if (!weeks.includes(weekId)) {
      weeks.push(weekId);
    }
    currentDate.setDate(currentDate.getDate() + 7)
  }

  return weeks
};

const formatWeekLabel = (weekId) => {
  const [year, month, week] = weekId.split("-");
  const monthName = new Date(year, month - 1, 1).toLocaleString("default", { month: "long" });
  return `${monthName} ${year} - Week ${week}`;
};

const generateAllMonths = () => {
  const months = [];
  for (let i = 0; i < 12; i++) {
    const date = new Date(2024, i, 1)
    months.push(date.toLocaleString("default", { month: "long" }));
  }
  return months;
};

const generateAllYears = (startYear, endYear) => {
  const years = []
  for (let year = startYear; year <= endYear; year++) {
    years.push(year.toString());
  }
  return years
};

const AdminDashboard = () => {
  const [backupDatabase, { isLoading: isBackingUp }] = useBackupDatabaseMutation();
  const [timeRange, setTimeRange] = useState("daily")

  const { data: sales, isLoading: loadingSales } = useGetTotalSalesQuery();
  const { data: customers, isLoading: loadingCustomers } = useGetUserCountQuery();
  const { data: orders, isLoading: loadingOrders } = useGetTotalOrderQuery();
  const { data: salesDetailDaily } = useGetTotalSalesByDateQuery();
  const { data: salesDetailWeekly } = useGetTotalSalesByWeekQuery();
  const { data: salesDetailMonthly } = useGetTotalSalesByMonthQuery();
  const { data: salesDetailYearly } = useGetTotalSalesByYearQuery();
  const { data: income } = useGetTotalIncomeCombineQuery();

  useEffect(() => {
    const now = new Date();
    const currentDate = now.getDate();

    if (currentDate === 1) {
      handleBackup();
    }
  }, []);

  const handleBackup = async () => {
    try {
      await backupDatabase().unwrap();
      toast.success("Backup Successfully!");
    } catch (error) {
      toast.error("Backup Failed!");
    }
  };

  const salesDetail =
    timeRange === "daily" ? salesDetailDaily :
      timeRange === "weekly" ? salesDetailWeekly :
        timeRange === "monthly" ? salesDetailMonthly : salesDetailYearly;

  const averageSales = sales?.totalSales && orders?.totalOrders ? Math.round(sales.totalSales / orders.totalOrders) : 0;

  const [chartConfig, setChartConfig] = useState({
    options: {
      chart: {
        type: "area",
        toolbar: {
          show: false,
        },
        zoom: {
          enabled: false,
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: "smooth",
        width: 2,
      },
      colors: ["#f97316"],
      tooltip: {
        theme: "dark",
        y: {
          formatter: (value) => `Rp${new Intl.NumberFormat("id-ID").format(value)}`,
        },
      },
      grid: {
        borderColor: "gray",
        strokeDashArray: 4,
        xaxis: {
          lines: {
            show: true,
          },
        },
      },
      xaxis: {
        categories: [],
        labels: {
          style: {
            colors: "#9CA3AF",
            fontSize: "12px",
          },
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
      },
      yaxis: {
        labels: {
          style: {
            colors: "white",
            fontSize: "12px",
          },
          formatter: (value) => `Rp ${value >= 1000000 ? `${value / 1000000}M` : value}`,
        },
      },
    },
    series: [
      {
        name: "Sales",
        data: [],
      },
    ],
  });

  useEffect(() => {
    if (salesDetail) {
      let categories = [];
      let formattedSales = [];

      if (timeRange === "daily") {
        const currentDate = new Date();
        const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        formattedSales = salesDetail
          .filter((item) => {
            const itemDate = new Date(item._id);
            return itemDate >= startDate && itemDate <= endDate;
          })
          .map((item) => ({
            x: item._id,
            y: item.totalSales,
          }));

        categories = formattedSales.map((item) => item.x);
      } else if (timeRange === "weekly") {
        const currentMonth = new Date().getMonth() + 1;
        categories = generateAllWeeksInMonth(currentMonth);

        const salesMap = salesDetail.reduce((acc, item) => {
          acc[item._id] = item.totalSales;
          return acc;
        }, {});

        formattedSales = categories.map((weekId) => ({
          x: formatWeekLabel(weekId),
          y: salesMap[weekId] || 0,
        }));
      } else if (timeRange === "monthly") {
        categories = generateAllMonths();

        const salesMap = salesDetail.reduce((acc, item) => {
          const monthName = new Date(2024, item._id.split("-")[1] - 1, 1).toLocaleString("default", { month: "long" });
          acc[monthName] = item.totalSales;
          return acc;
        }, {});

        formattedSales = categories.map((month) => ({
          x: month,
          y: salesMap[month] || 0,
        }));
      } else if (timeRange === "yearly") {
        categories = generateAllYears(2025, 2030);

        const salesMap = salesDetail.reduce((acc, item) => {
          acc[item._id] = item.totalSales;
          return acc;
        }, {});

        formattedSales = categories.map((year) => ({
          x: year,
          y: salesMap[year] || 0,
        }));
      }

      setChartConfig((prev) => ({
        ...prev,
        options: {
          ...prev.options,
          xaxis: {
            ...prev.options.xaxis,
            categories: categories,
          },
        },
        series: [
          {
            name: "Sales",
            data: formattedSales.map((item) => item.y),
          },
        ],
      }));
    }
  }, [salesDetail, timeRange]);

  return (
    <div className="min-h-screen">
      <div className="p-6 xl:ml-[4rem] md:ml-[0rem]">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard Overview</h1>
          <div className="flex mt-[1.5rem] items-center space-x-4">
            <div className="flex items-center space-x-2">
              <FaCalendarAlt className="text-gray-800" />
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
            <div className="flex items-center space-x-2 text-sm text-gray-800">
              <FaCalendar className="text-gray-800" />
              <span>{new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
            </div>
            <button
              onClick={handleBackup}
              disabled={isBackingUp}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-orange-600 transition"
            >
              {isBackingUp ? "Backing up..." : "Backup Data"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          <StatBox
            title="Total Sales"
            value={sales?.totalSales ?
              `Rp${new Intl.NumberFormat("id-ID").format(sales.totalSales)}` : "Rp 0"}
            icon={<FaMoneyBillWave />}
            loading={loadingSales}
          />
          <StatBox
            title="Profit"
            value={`Rp${new Intl.NumberFormat("id-ID").format(income?.totalProfit)}`}
            icon={<FaMoneyBillAlt />}
            loading={loadingOrders}
          />
          <StatBox
            title="Average Sales"
            value={`Rp${new Intl.NumberFormat("id-ID").format(averageSales)}`}
            icon={<FaChartLine />}
            loading={loadingSales || loadingOrders}
          />
          <StatBox
            title="Total Customers Account"
            value={customers?.userCount || 0}
            icon={<FaUser />}
            loading={loadingCustomers}
          />
          <StatBox
            title="Total Orders"
            value={orders?.totalOrders || 0}
            icon={<FaShoppingBag />}
            loading={loadingOrders}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
          <div className="bg-neutral-800 rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-bold text-white">Sales Trend ({timeRange})</h2>
            {chartConfig.series[0].data.length > 0 ? (
              <Chart options={chartConfig.options} series={chartConfig.series} type="area" height={350} />
            ) : (
              <div className="flex items-center justify-center h-[350px] text-gray-800">No sales data available</div>
            )}
          </div>
          <div className="bg-neutral-800 rounded-lg shadow-lg">
            <IncomePieChart />
          </div>
        </div>

        <div className="rounded-lg p-6 ">
          <OrderList />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;