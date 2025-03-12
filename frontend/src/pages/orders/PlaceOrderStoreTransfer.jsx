import { useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import { useDispatch, useSelector } from "react-redux"
import Message from "../../components/Message"
import ProgressSteps from "../../components/ProgressSteps"
import Loader from "../../components/loader"
import { clearCartItems } from "../../redux/features/cart/cartSlice"
import { usePayOrderStoreMutation, useCreateStoreTransferOrderMutation } from "../../redux/api/orderApiSlice"

const PlaceOrderStoreTransfer = () => {
    const navigate = useNavigate()
    const cart = useSelector(state => state.cart)
    const itemsPrice = cart.cartItems.reduce((acc, item) => acc + item.qty * item.price, 0) || 0
    const discount = itemsPrice < 5000000 ? 0 : Math.round(itemsPrice * 0.10);
    const taxPrice = Math.round(itemsPrice * 0.11)
    const totalPrice = Math.round(itemsPrice + taxPrice - discount)
    const [createOrder, { isLoading, error }] = useCreateStoreTransferOrderMutation()
    const [payOrder] = usePayOrderStoreMutation()

    const dispatch = useDispatch()

    const placeOrderHandler = async () => {
        try {
            if (!window.snap) {
                const script = document.createElement('script')
                script.src = 'https://app.sandbox.midtrans.com/snap/snap.js'
                script.async = true
                script.onload = async () => {
                    await handlePaymentProcess()
                }
                document.body.appendChild(script)
            } else {
                await handlePaymentProcess()
            }
        } catch (error) {
            toast.error(error.message || 'Payment failed. Please try again.');
        }
    }

    const handlePaymentProcess = async () => {
        const res = await createOrder({
            orderItems: cart.cartItems,
            paymentMethod: cart.paymentMethod,
            itemsPrice: cart.itemsPrice,
            taxPrice: cart.taxPrice,
            discount: discount,
            totalPrice: cart.totalPrice,
        }).unwrap()

        const token = res.token
        dispatch(clearCartItems())
        if (token) {
            window.snap.pay(token, {
                onSuccess: async (details) => {
                    try {
                        await payOrder({
                            orderId: res.order._id,
                            details,
                            payment_type: details.payment_type
                        }).unwrap()
                        toast.success('payment successfully')
                        navigate(`/order/${res.order._id}/store`);
                    } catch (error) {
                        toast.error(error?.data?.message || error.message);
                    }
                },
                onPending: function (details) {
                    console.log('Payment pending:', details)
                    navigate(`/order/${res.order._id}`)
                },
                onError: function (details) {
                    console.error('Payment error:', details)
                    toast.error('Payment failed. Please try again.')
                },
                onClose: function () {
                    console.log('Customer closed the popup without finishing the payment')
                    toast.warn('Payment cancelled. Please try again.')
                }
            })
        } else {
            throw new Error('Payment token not found');
        }
    }

    return (
        <>
            <ProgressSteps step1 step2 step3 />
            <div className="container mx-auto mt-8">
                {cart.cartItems.length === 0 ? (
                    <Message>Your cart is empty</Message>
                ) : (
                    <div className="overflow-x-auto ml-[7rem] text-gray-950">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left">
                                    <th className="py-2 px-3">Image</th>
                                    <th className="py-2 px-3">Product</th>
                                    <th className="py-2 px-3">Qty</th>
                                    <th className="py-2 px-3">Price</th>
                                    <th className="py-2 px-3">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cart.cartItems.map((item) => (
                                    <tr key={item.product}>
                                        <td><img src={item?.images[0]} alt={item.name} className="w-16 h-16 object-cover" /></td>
                                        <td><Link to={`/product/${item.product}`}>{item.name}</Link></td>
                                        <td>{item.qty}</td>
                                        <td>Rp{item.price.toLocaleString()}</td>
                                        <td>Rp{(item.qty * item.price).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="mt-8 ml-[7rem] text-gray-950">
                    <h2 className="text-xl font-semibold">Order Summary</h2>
                    <ul>
                        <li>Items: Rp{itemsPrice.toLocaleString()}</li>
                        <li>Tax: Rp{taxPrice.toLocaleString()}</li>
                        <li>Discount: Rp{discount.toLocaleString()}</li>
                        <li>Total: Rp{totalPrice.toLocaleString()}</li>
                    </ul>
                </div>
                <button
                    className="bg-orange-500 text-white py-2 px-4 rounded w-[70rem] mt-4 ml-[10rem]"
                    onClick={placeOrderHandler}
                    disabled={isLoading}
                >
                    {isLoading ? <Loader /> : "Place Order"}
                </button>

                {error && <Message variant="danger">{error.data.message}</Message>}
            </div>
        </>
    );
}

export default PlaceOrderStoreTransfer