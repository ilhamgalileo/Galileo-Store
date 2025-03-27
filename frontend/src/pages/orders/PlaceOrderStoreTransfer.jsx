import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import Message from "../../components/Message";
import ProgressSteps from "../../components/ProgressSteps";
import Loader from "../../components/loader";
import { 
  usePayOrderStoreMutation,
  useCreateStoreTransferOrderMutation,
  useGetMemberByPhoneStoreQuery
} from "../../redux/api/orderApiSlice";
import { clearCartItems } from "../../redux/features/cart/cartSlice";

const PlaceOrderStoreTransfer = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart);
  const itemsPrice = cart.cartItems.reduce((acc, item) => acc + item.qty * item.price, 0) || 0;

  const [membership, setMembership] = useState("None");
  const [totalPrice, setTotalPrice] = useState(0);

  const calculateDiscount = (itemsPrice, membership) => {
    switch (membership) {
      case "Platinum":
        return Math.round(itemsPrice * 0.07);
      case "Gold":
        return Math.round(itemsPrice * 0.05);
      case "Silver":
        return Math.round(itemsPrice * 0.03);
      default:
        return 0;
    }
  };

  useEffect(() => {
    const discount = calculateDiscount(itemsPrice, membership);
    const newTotalPrice = Math.round(itemsPrice - discount);
    setTotalPrice(newTotalPrice);
  }, [itemsPrice, membership]);

  const [createOrder, { isLoading: isOrderLoading, error: orderError }] = useCreateStoreTransferOrderMutation();
  const [payOrder] = usePayOrderStoreMutation();

  const [phoneInput, setPhoneInput] = useState("");
  const [isCheckingMembership, setIsCheckingMembership] = useState(false);
  const [phoneToCheck, setPhoneToCheck] = useState("");

  const { data: membershipData, refetch, isError } = useGetMemberByPhoneStoreQuery(phoneToCheck, {
    skip: !phoneToCheck,
  });

  const handleCheckMembership = async () => {
    if (!phoneInput) {
      toast.error("Please enter a phone number");
      return;
    }
    setIsCheckingMembership(true);
    setPhoneToCheck(phoneInput);
    try {
      await refetch();
    } catch (error) {
      if (isError) {
        toast.error("Failed to check membership");
      }
    } finally {
      setIsCheckingMembership(false);
    }
  };

  useEffect(() => {
    if (membershipData) {
      setMembership(membershipData.membership);
      toast.success(`Membership found: ${membershipData.membership}`);
    }
  }, [membershipData]);

  const placeOrderHandler = async () => {
    try {
      if (!window.snap) {
        const script = document.createElement('script');
        script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
        script.async = true;
        script.onload = async () => {
          await handlePaymentProcess();
        };
        document.body.appendChild(script);
      } else {
        await handlePaymentProcess();
      }
    } catch (error) {
      toast.error(error.message || 'Payment failed. Please try again.');
    }
  };

  const handlePaymentProcess = async () => {
    try {
      const res = await createOrder({
        orderItems: cart.cartItems,
        paymentMethod: cart.paymentMethod,
        totalPrice: cart.totalPrice,
        membership: membership,
        membershipName: membershipData.username,
        membershipEmail: membershipData.email,
        membershipPhone: membershipData.phone,
    }).unwrap()

      const token = res.token;
      dispatch(clearCartItems());
      
      if (token) {
        window.snap.pay(token, {
          onSuccess: async (details) => {
            try {
              await payOrder({
                orderId: res.order._id,
                details,
                payment_type: details.payment_type
              }).unwrap();
              toast.success('Payment successful');
              navigate(`/order/${res.order._id}/store`);
            } catch (error) {
              toast.error(error?.data?.message || error.message);
            }
          },
          onPending: function (details) {
            console.log('Payment pending:', details);
            navigate(`/order/${res.order._id}`);
          },
          onError: function (details) {
            console.error('Payment error:', details);
            toast.error('Payment failed. Please try again.');
          },
          onClose: function () {
            console.log('Customer closed the popup without finishing the payment');
            toast.warn('Payment cancelled. Please try again.');
          }
        });
      } else {
        throw new Error('Payment token not found');
      }
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
                {calculateDiscount(itemsPrice, membership) > 0 && (
                  <>
                    <div className="flex justify-between text-white">
                      <span>Discount ({membership}):</span>
                      <span>Rp{calculateDiscount(itemsPrice, membership).toLocaleString()}</span>
                    </div>
                    <div
                      className={`text-sm font-medium ${membership === "Platinum"
                        ? "text-purple-500"
                        : membership === "Gold"
                          ? "text-yellow-500"
                          : membership === "Silver"
                            ? "text-gray-400"
                            : "text-white"
                        }`}
                    >
                      Members with {membership} level receive a discount of {membership === "Platinum" ? "7%" : membership === "Gold" ? "5%" : "3%"}.
                    </div>
                  </>
                )}
                <div className="flex justify-between font-semibold text-lg pt-3 border-t border-gray-200">
                  <span>Total:</span>
                  <span>Rp{totalPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-neutral-700 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Store Transfer Details</h2>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="Enter customer phone"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  />
                  <button
                    onClick={handleCheckMembership}
                    disabled={isCheckingMembership}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCheckingMembership ? "Checking..." : "Check Membership"}
                  </button>
                </div>
                
                {membershipData && (
                  <div className="bg-neutral-600 p-4 rounded-lg">
                    <h3 className="font-semibold text-white">Member Found:</h3>
                    <p className="text-white">Name: {membershipData.username}</p>
                    <p className="text-white">Membership: {membershipData.membership}</p>
                    <p className="text-white">Point: {membershipData.point}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={placeOrderHandler}
            disabled={isOrderLoading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isOrderLoading ? <Loader /> : "Place Order with Store Transfer"}
          </button>

          {orderError && <Message variant="danger">{orderError.data?.message}</Message>}
        </div>
      )}
    </div>
  );
};

export default PlaceOrderStoreTransfer;