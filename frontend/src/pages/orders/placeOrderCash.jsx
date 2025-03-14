import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import Message from "../../components/Message";
import ProgressSteps from "../../components/ProgressSteps";
import Loader from "../../components/loader";
import { useCreateCashOrderMutation } from "../../redux/api/orderApiSlice";
import { clearCartItems } from "../../redux/features/cart/cartSlice";

const PlaceCashOrder = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const cart = useSelector((state) => state.cart)

  const itemsPrice = cart.cartItems.reduce((acc, item) => acc + item.qty * item.price, 0) || 0
  const taxPrice = Math.round(0.11 * itemsPrice)
  const discount = itemsPrice < 5000000 ? 0 : Math.round(itemsPrice * 0.10)
  const totalPrice = Math.round((itemsPrice + taxPrice - discount) || 0)

  const [createCashOrder, { isLoading, error }] = useCreateCashOrderMutation()
  const [cashDetails, setCashDetails] = useState({
    customerName: "",
    phone: "",
    receivedAmount: "",
    discount: "",
    cust_address: "",
  })

  const formatCurrency = (value) => {
    const numericValue = value.replace(/\D/g, "");
    if (!numericValue) return "";

    return new Intl.NumberFormat("id-ID").format(numericValue);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "receivedAmount") {
      setCashDetails({ ...cashDetails, [name]: formatCurrency(value) });
    } else {
      setCashDetails({ ...cashDetails, [name]: value });
    }
  };

  const placeOrderHandler = async () => {
    try {
      if (!cashDetails.receivedAmount) {
        toast.error("Please fill Received Amount fields");
        return;
      }

      // Remove formatting (commas) from receivedAmount
      const receivedAmount = Number(cashDetails.receivedAmount.replace(/\D/g, ""));

      if (receivedAmount < totalPrice) {
        toast.error("Received amount must be greater than or equal to total price");
        return;
      }

      const orderItems = cart.cartItems.map((item) => ({
        product: item._id,
        name: item.name,
        quantity: item.qty,
        price: item.price,
      }));

      const res = await createCashOrder({
        customerName: cashDetails.customerName,
        phone: cashDetails.phone,
        cust_address: cashDetails.cust_address,
        receivedAmount,
        orderItems,
        discount,
        taxPrice,
        totalAmount: totalPrice,
      }).unwrap();

      dispatch(clearCartItems());
      toast.success("Order placed successfully!");
      navigate(`/order/${res._id}/cash`);
    } catch (error) {
      toast.error(error?.data?.message || "Order placement failed. Please try again.");
    }
  };

  return (
    <div className="container mx-auto max-w-6xl">
      <ProgressSteps step1 step2 step3 />

      {cart.cartItems.length === 0 ? (
        <Message>Your cart is empty</Message>
      ) : (
        <div className="space-y-5 mt-8">
          <div className="bg-neutral-700 rounded-lg shadow-md p-4">
            <h2 className="text-xl font-semibold mb-4">Order Items</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-orange-600">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Image</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Product</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Qty</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Price</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {cart.cartItems.map((item) => (
                    <tr key={item._id} className="hover:bg-neutral-600">
                      <td className="px-4 py-3">
                        <img src={item.images[0]} alt={item.name} className="w-16 h-16 object-cover rounded" />
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`/product/${item._id}`} className="text-white hover:underline hover:text-gray-400">
                          {item.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{item.qty}</td>
                      <td className="px-4 py-3">Rp{item.price.toLocaleString()}</td>
                      <td className="px-4 py-3">Rp{(item.qty * item.price).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-neutral-700 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-white">
                  <span>Items:</span>
                  <span>Rp{itemsPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-white">
                  <span>Tax (PPN 11%):</span>
                  <span>Rp{taxPrice.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-white">
                    <span>Discount:</span>
                    <span>Rp{discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-lg pt-3 border-t border-gray-200">
                  <span>Total:</span>
                  <span>Rp{totalPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-neutral-700 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Cash Order Details</h2>
              <div className="space-y-4">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    Rp
                  </span>
                  <input
                    type="text"
                    name="receivedAmount"
                    value={cashDetails.receivedAmount}
                    onChange={handleChange}
                    placeholder="Received Amount"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    required
                  />
                </div>
                <input
                  type="text"
                  name="customerName"
                  value={cashDetails.customerName}
                  onChange={handleChange}
                  placeholder="Customer Name (optional)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                />
                <input
                  type="number"
                  name="phone"
                  value={cashDetails.phone}
                  onChange={handleChange}
                  placeholder="Phone Number (optional)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                />
                <textarea
                  name="cust_address (optional)"
                  value={cashDetails.cust_address}
                  onChange={handleChange}
                  placeholder="Customer Address (optional)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none h-32"
                />
              </div>
            </div>
          </div>

          <button
            onClick={placeOrderHandler}
            disabled={isLoading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader /> : "Place Order with Cash"}
          </button>

          {error && <Message variant="danger">{error.data?.message}</Message>}
        </div>
      )}
    </div>
  )
}

export default PlaceCashOrder