import Message from "../../components/Message";
import Loader from "../../components/loader";
import { Link } from "react-router-dom";
import { useGetMyOrdersQuery } from "../../redux/api/orderApiSlice";

const UserOrder = () => {
  const { data: orders, isLoading, error } = useGetMyOrdersQuery();

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold mb-6 ml-[5rem] text-gray-800">My Orders</h2>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader />
        </div>
      ) : error ? (
        <Message variant="danger">{error?.data?.error || error.error}</Message>
      ) : (
        <div className="overflow-x-auto ml-[3rem]">
          <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
            <thead className="bg-orange-600 text-white">
              <tr>
                <th className="py-3 px-4 text-left">IMAGE</th>
                <th className="py-3 px-4 text-left">ID</th>
                <th className="py-3 px-4 text-left">DATE</th>
                <th className="py-3 px-4 text-center">Item Purchased</th>
                <th className="py-3 px-4 text-left">TOTAL</th>
                <th className="py-3 px-4 text-left">PAID</th>
                <th className="py-3 px-4 text-left">DELIVERED</th>
                <th className="py-3 px-4 text-left">ACTION</th>
              </tr>
            </thead>
            <tbody className="text-gray-100 bg-gray-700">
              {orders.map((order) => (
                <tr key={order._id}>
                  <td className="py-4 px-4 border-b">
                    <img
                      src={order.orderItems[0]?.images[0]}
                      alt={order.orderItems[0]?.name}
                      className="w-24 h-24 object-cover rounded"
                    />
                  </td>
                  <td className="py-4 px-4 border-b">{order._id}</td>
                  <td className="py-4 px-4 border-b">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-4 border-b text-center">
                    {order.orderItems?.length}
                  </td>
                  <td className="py-4 px-4 border-b">
                    RP{new Intl.NumberFormat("id-ID").format(order.bill || order.totalPrice)}
                  </td>
                  <td className="py-4 px-4 border-b">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm ${order.isPaid ? "bg-green-600 text-green-100" : "bg-red-600 text-red-100"
                        }`}
                    >
                      {order.isPaid ? "Completed" : "Cancelled"}
                    </span>
                  </td>
                  <td className="py-4 px-4 border-b">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm ${order.isDelivered ? "bg-green-600 text-green-100" : "bg-red-600 text-red-100"
                        }`}
                    >
                      {order.isDelivered ? "Completed" : "Pending"}
                    </span>
                  </td>
                  <td className="py-4 px-4 border-b">
                    <Link to={`/order/${order._id}`}>
                      <button className="bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700 transition-colors">
                        View Details
                      </button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserOrder;