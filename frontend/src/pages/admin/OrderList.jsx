import React, { useState } from "react";
import Message from "../../components/Message";
import Loader from "../../components/loader";
import { Link } from "react-router-dom";
import { useGetAllOrdersQuery } from "../../redux/api/orderApiSlice";
import ReactPaginate from "react-paginate";

const OrderList = () => {
  const { data, isLoading, error } = useGetAllOrdersQuery();
  const orders = data?.orders || [];
  const cashOrders = data?.cashOrders || [];
  const orderStore = data?.orderStore || [];

  const [searchTerm, setSearchTerm] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [deliveryFilter, setDeliveryFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 15;

  const StatusBadge = ({ isComplete, label }) => (
    <span
      className={`px-3 py-1 rounded-full text-sm font-medium ${
        isComplete ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
      }`}
    >
      {label}
    </span>
  );

  const filteredOrders = orders.filter((order) => {
    const matchesSearchTerm =
      order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesPaymentFilter =
      paymentFilter === "all" ||
      (paymentFilter === "paid" && order.isPaid) ||
      (paymentFilter === "unpaid" && !order.isPaid);

    const matchesDeliveryFilter =
      deliveryFilter === "all" ||
      (deliveryFilter === "complete" && order.isDelivered) ||
      (deliveryFilter === "pending" && !order.isDelivered);

    const matchesPaymentMethodFilter =
      paymentMethodFilter === "all" ||
      (paymentMethodFilter === "cash" && order.paymentMethod === "cash") ||
      (paymentMethodFilter === "qris" && order.paymentMethod === "qris") ||
      (paymentMethodFilter === "cstore" && order.paymentMethod === "cstore") ||
      (paymentMethodFilter === "bank_transfer" && order.paymentMethod === "bank_transfer") ||
      (paymentMethodFilter === "credit_card" && order.paymentMethod === "credit_card");

    const shouldIncludeDelivery = deliveryFilter === "all" || order.isDelivered !== undefined;

    return (
      matchesSearchTerm &&
      matchesPaymentFilter &&
      matchesDeliveryFilter &&
      matchesPaymentMethodFilter &&
      shouldIncludeDelivery
    );
  });

  const filteredCashOrders = cashOrders.filter((order) => {
    const matchesSearchTerm =
      order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPaymentFilter =
      paymentFilter === "all" ||
      (paymentFilter === "paid" && order.isPaid) ||
      (paymentFilter === "unpaid" && !order.isPaid);

    const matchesPaymentMethodFilter =
      paymentMethodFilter === "all" ||
      (paymentMethodFilter === "cash" && order.paymentMethod === "cash") ||
      (paymentMethodFilter === "non-cash" && order.paymentMethod !== "cash");

    const shouldIncludeDelivery = deliveryFilter === "all" || order.isDelivered !== undefined;

    return matchesSearchTerm && matchesPaymentFilter && matchesPaymentMethodFilter && shouldIncludeDelivery;
  });

  const filteredStoreOrders = orderStore.filter((order) => {
    const matchesSearchTerm =
      order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesPaymentFilter =
      paymentFilter === "all" ||
      (paymentFilter === "paid" && order.isPaid) ||
      (paymentFilter === "unpaid" && !order.isPaid);

    const matchesDeliveryFilter =
      deliveryFilter === "all" ||
      (deliveryFilter === "complete" && order.isDelivered) ||
      (deliveryFilter === "pending" && !order.isDelivered);

    const matchesPaymentMethodFilter =
      paymentMethodFilter === "all" ||
      (paymentMethodFilter === "cash" && order.paymentMethod === "cash") ||
      (paymentMethodFilter === "qris" && order.paymentMethod === "qris") ||
      (paymentMethodFilter === "cstore" && order.paymentMethod === "cstore") ||
      (paymentMethodFilter === "bank_transfer" && order.paymentMethod === "bank_transfer") ||
      (paymentMethodFilter === "credit_card" && order.paymentMethod === "credit_card");

    const shouldIncludeDelivery = deliveryFilter === "all" || order.isDelivered !== undefined;

    return (
      matchesSearchTerm &&
      matchesPaymentFilter &&
      matchesDeliveryFilter &&
      matchesPaymentMethodFilter &&
      shouldIncludeDelivery
    );
  });

  const allFilteredOrders = [
    ...filteredOrders,
    ...filteredCashOrders,
    ...filteredStoreOrders,
  ];

  const pageCount = Math.ceil(allFilteredOrders.length / itemsPerPage);

  const offset = currentPage * itemsPerPage;
  const currentOrders = allFilteredOrders.slice(offset, offset + itemsPerPage);

  const handlePageClick = ({ selected }) => {
    setCurrentPage(selected);
  };

  if (isLoading) return <Loader />;
  if (error) return <Message variant="danger">{error?.data?.message || error.error}</Message>;

  return (
    <div className="grid gap-4 p-6">
      <div className="rounded-lg bg-neutral-700 p-6 shadow">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-gray-100">All Order</h2>
        </div>
        <div className="mt-1 flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
          <input
            type="text"
            placeholder="Search by ID or Customer Name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-1/3 px-3 py-2 text-white bg-gray-600 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="bg-gray-600 w-full md:w-1/4 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>

          <select
            value={deliveryFilter}
            onChange={(e) => setDeliveryFilter(e.target.value)}
            className="bg-gray-600 w-full md:w-1/4 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">All Deliveries</option>
            <option value="complete">Complete</option>
            <option value="pending">Pending</option>
          </select>

          <select
            value={paymentMethodFilter}
            onChange={(e) => setPaymentMethodFilter(e.target.value)}
            className="bg-gray-600 w-full md:w-1/4 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">All Payment Methods</option>
            <option value="cash">Cash</option>
            <option value="qris">Qris</option>
            <option value="cstore">CS Store</option>
            <option value="bank_transfer">Bank transfer</option>
            <option value="credit_card">Credit Card</option>
          </select>
        </div>

        <div className="mt-8 flex flex-col">
          <div className="-mx-4 -my-1 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-[90%] py-2 ml-[4rem]">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-orange-600">
                    <tr className="text-white">
                      <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold">Total Items</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold">ID</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold">User</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold">Total</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold">Date</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold">Status</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold">Payment Method</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold">Delivery</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-gray-600">
                    {currentOrders.map((order) => (
                      <tr key={order._id}>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-white">
                          {order?.orderItems?.length || 0} Items
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-white">
                          {order._id}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-white">
                          {order.user ? order.user.username : "N/A"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-white">
                          Rp{new Intl.NumberFormat("id-ID").format(order.bill || order.totalPrice)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-white">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "N/A"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <StatusBadge
                            isComplete={order.isPaid}
                            label={order.isPaid ? "Paid" : "Unpaid"}
                          />
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-white">
                          {order.paymentMethod || "N/A"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-white">
                          {filteredStoreOrders.includes(order) || filteredCashOrders.includes(order) ? (
                            "N/A"
                          ) : (
                            <StatusBadge
                              isComplete={order.isDelivered}
                              label={order.isDelivered ? "Complete" : "Pending"}
                            />
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          {filteredOrders.includes(order) && (
                            <Link to={`/order/${order._id}`} className="text-gray-100 hover:underline">
                              View Order
                            </Link>
                          )}
                          {filteredCashOrders.includes(order) && (
                            <Link to={`/order/${order._id}/cash`} className="text-gray-100 hover:underline">
                              View Cash Order
                            </Link>
                          )}
                          {filteredStoreOrders.includes(order) && (
                            <Link to={`/order/${order._id}/store`} className="text-gray-100 hover:underline">
                              View Store Order
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <ReactPaginate
          previousLabel={"Previous"}
          nextLabel={"Next"}
          breakLabel={"..."}
          pageCount={pageCount}
          marginPagesDisplayed={2}
          pageRangeDisplayed={5}
          onPageChange={handlePageClick}
          containerClassName={"flex justify-center mt-4"}
          pageClassName={"mx-1"}
          pageLinkClassName={
            "px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-600"
          }
          activeClassName={"bg-blue-500 text-white"}
          activeLinkClassName={"bg-orange-500 text-white"}
          previousClassName={"mx-1"}
          nextClassName={"mx-1"}
          previousLinkClassName={
            "px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-500"
          }
          nextLinkClassName={
            "px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-500"
          }
          disabledClassName={"opacity-50 cursor-not-allowed"}
        />
      </div>
    </div>
  );
};

export default OrderList;