import { useEffect, useRef, useCallback, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import moment from "moment";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Message from "../../components/Message";
import Loader from "../../components/loader";
import logo from '../../assets/galileo2.png'
import { useReturnStoreOrderMutation, useGetStoreOrderDetailsQuery } from "../../redux/api/orderApiSlice";
import { FaDownload } from "react-icons/fa";

const StoreOrder = () => {
    const { id: orderId } = useParams();
    const invoiceRef = useRef();
    const { data: order, refetch, isLoading, error } = useGetStoreOrderDetailsQuery(orderId);
    const [returnOrder, { isLoading: loadingReturn }] = useReturnStoreOrderMutation();
    const { userInfo } = useSelector((state) => state.auth);
    const [selectedItems, setSelectedItems] = useState([]);
    const [editedQuantities, setEditedQuantities] = useState({});
    const [selectAll, setSelectAll] = useState(false);
    const [hideElements, setHideElements] = useState(false);

    useEffect(() => {
        refetch();
    }, [refetch]);

    const handleDownloadPDF = useCallback(async () => {
        if (!invoiceRef.current) return;

        setHideElements(true)

        setTimeout(async () => {
            const canvas = await html2canvas(invoiceRef.current, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            pdf.setFillColor(240, 240, 239);
            pdf.rect(0, 0, pageWidth, pageHeight, "F");
            const imgWidth = 180;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            pdf.addImage(imgData, "PNG", 20, 25, imgWidth, imgHeight);
            pdf.save(`invoice-${orderId}.pdf`);
            setHideElements(false);
        }, 500);
    }, [orderId]);

    useEffect(() => {
        const handleBeforePrint = () => setHideElements(true);
        const handleAfterPrint = () => setHideElements(false);

        window.addEventListener("beforeprint", handleBeforePrint);
        window.addEventListener("afterprint", handleAfterPrint);

        return () => {
            window.removeEventListener("beforeprint", handleBeforePrint);
            window.removeEventListener("afterprint", handleAfterPrint);
        };
    }, []);

    const toggleSelectAll = () => {
        if (selectAll) {
            setSelectedItems([]);
        } else {
            const allItems = order.orderItems.map((item) => ({
                product: item.product,
                qty: item.qty,
                price: item.price,
            }))
            setSelectedItems(allItems)
        }
        setSelectAll(!selectAll)
    }

    const toggleItemSelection = (item) => {
        setSelectedItems((prev) => {
            return prev.some((selected) => selected.product === item.product)
                ? prev.filter((selected) => selected.product !== item.product)
                : [...prev, { product: item.product, qty: item.qty, price: item.price }];
        });
    };

    const handleQuantityChange = (productId, quantity) => {
        setEditedQuantities((prev) => ({
            ...prev,
            [productId]: quantity,
        }));
    };

    const returnHandler = useCallback(async () => {
        if (selectedItems.length === 0) {
            toast.error("Please select at least one item to return.");
            return;
        }
        if (window.confirm("Are you sure you want to return the selected items?")) {
            try {
                const returnedItems = selectedItems.map((item) => ({
                    ...item,
                    qty: editedQuantities[item.product] || item.qty,
                }));
                await returnOrder({ orderId, returnedItems }).unwrap();
                toast.success("Order items returned successfully");
                setSelectedItems([]);
                setEditedQuantities({});
                setSelectAll(false);
                refetch();
            } catch {
                toast.error("Failed to return order items");
            }
        }
    }, [returnOrder, orderId, selectedItems, refetch, editedQuantities]);

    return isLoading ? (
        <Loader />
    ) : error ? (
        <Message variant="danger">{error.data.message}</Message>
    ) : (
        <div className="min-h-screen">
            <div className="container mx-auto max-w-[85%] ml-[9%] mt-[1rem] relative">
                <div className="flex justify-end sticky z-0">
                    <button onClick={handleDownloadPDF}
                        className={`bg-blue-500 text-sm text-white font-bold px-2 py-2 mr-7 rounded-full ${hideElements ? "hidden" : ""}`}>
                        <FaDownload />
                    </button>
                </div>
                <div ref={invoiceRef} className="w-full p-2 mt-2 relative bg-[#f0f0ef]">
                    <img src={logo} alt="Logo" className="absolute top-0 md:top-0 left-2 w-[6.5rem] md:w-[12rem] h-auto" />
                    <h2 className="text-black text-xl md:text-2xl font-medium mr-[2rem] mt-[1rem] mb-[2.5rem] text-right">INVOICE</h2>
                    <div className="grid top-[5rem]">
                        <div className="text-gray-950 text-xs md:text-sm">
                            <h3 className="font-bold text-sm md:text-xl md:mb-2.5 mt-[2rem] md:mt-[5rem]">Order Information: </h3>
                            <p className="mb-1">Order ID: <strong>{order._id}</strong></p>
                            <p className="mb-1">Date: <strong>{moment(order.createdAt).format("DD MMMM YYYY")}</strong></p>
                            <p className="mb-1">Payment Status: <strong>{order.isPaid ?
                                <span className="text-green-700">Paid on {moment(order.paidAt).format("DD MMMM YYYY [at] HH:mm")}</span> :
                                <span className="text-red-600">Cancelled</span>
                            }</strong></p>
                            <p className="mb-1">Method: <strong>{order.paymentMethod}</strong></p>
                        </div>
                        <div className="text-gray-900 absolute md:top-[9.5rem] right-[1rem] md:right-[7rem] text-xs md:text-sm">
                            <h3 className="text-xs md:text-xl font-bold mb-0.5 md:mb-2.5">Cashier: </h3>
                            <p className="mb-1">Name: {order?.user?.username || "Unknown"}</p>
                            {order?.membership && (
                                <div>
                                    <h3 className="text-xs md:text-xl font-bold mb-0.5 md:mb-2.5">Member Customer: </h3>
                                    <p className="mb-1">Name: {order?.membershipName}</p>
                                    <p className="mb-1">Email: {order?.membershipEmail}</p>
                                    <p className="mb-1">Phone: {order?.membershipPhone}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        {order?.orderItems?.length > 0 && (
                            <div className="mt-4">
                                <h3 className="md:text-lg text-xs font-semibold mt-3 text-gray-950">Ordered Items: </h3>
                                <table className="table-auto w-full text-gray-800 border-collapse">
                                    <thead className="border-b-2 border-gray-400 text-xs md:text-sm">
                                        <tr>
                                            {userInfo.user?.superAdmin && (
                                                <th>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectAll}
                                                        onChange={toggleSelectAll}
                                                        className={`w-6 h-5 mt-2 cursor-pointer ${hideElements ? "hidden" : ""}`}
                                                    />
                                                </th>
                                            )}
                                            <th className="p-2">Product</th>
                                            <th className="p-2">Quantity</th>
                                            <th className="p-2">Unit Price</th>
                                            <th className="p-2">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-gray-900 text-xs md:text-sm">
                                        {order?.orderItems.map((item, index) => (
                                            <tr key={index} className="text-center">
                                                {userInfo.user.superAdmin && (
                                                    <td className="p-2">
                                                        <input
                                                            type="checkbox"
                                                            className={`w-6 h-5 mt-1 cursor-pointer ${hideElements ? "hidden" : ""}`}
                                                            checked={selectedItems.some((selected) => selected.product === item.product)}
                                                            onChange={() => toggleItemSelection(item)}
                                                        />
                                                    </td>
                                                )}
                                                <td className="p-2">
                                                    <Link to={`/product/${item.product}`} className="text-gray-700 hover:text-gray-400">
                                                        {item.name}
                                                    </Link>
                                                </td>
                                                <td className="p-2">
                                                    {userInfo.user.isAdmin && selectedItems.some((selected) => selected.product === item.product) ? (
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max={item.qty}
                                                            value={editedQuantities[item.product] || item.qty}
                                                            onChange={(e) => handleQuantityChange(item.product, parseInt(e.target.value))}
                                                            className="w-16 text-center"
                                                        />
                                                    ) : (
                                                        item.qty
                                                    )}
                                                </td>
                                                <td className="p-2">RP{new Intl.NumberFormat('id-ID').format(item.price)}</td>
                                                <td className="p-2">RP{new Intl.NumberFormat('id-ID').format(item.qty * item.price)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {order?.returnedItems?.length > 0 && (
                        <div className="mt-4">
                            <h3 className="text-sm md:text-lg font-semibold text-red-800">Returned Items:</h3>
                            <table className="table-auto w-full text-xs md:text-sm text-gray-800 border-collapse">
                                <thead className="border-b-2 border-red-600">
                                    <tr className="text-red-800 text-xs md:text-sm">
                                        <th className="p-2">Product</th>
                                        <th className="p-2">Quantity</th>
                                        <th className="p-2">Unit Price</th>
                                        <th className="p-2">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {order?.returnedItems.map((item, index) => (
                                        <tr key={index} className="text-center text-red-800 text-xs md:text-sm">
                                            <Link to={`/product/${item.product}`} className="text-red-800 hover:text-red-400">
                                                {item.name}
                                            </Link>
                                            <td className="p-2">{item.qty}</td>
                                            <td className="p-2">Rp{new Intl.NumberFormat('id-ID').format(item.price)}</td>
                                            <td className="p-2">Rp{new Intl.NumberFormat('id-ID').format(item.price)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="mt-[3rem] flex justify-between gap-4 text font-medium">
                        <div className="flex-1">
                            {order.returnedItems && order.returnedItems.length > 0 && (
                                <div className=" p-4 rounded-lg text-red-800 text-xs md:text-sm">
                                    <h3 className="text-sm md:text-lg font-semibold mb-1.5">Return Details: </h3>
                                    <div className="flex justify-between mb-1">
                                        <p>Return Status:</p>
                                        <strong>
                                            {order.orderItems.length === 0
                                                ? "True"
                                                : `${order.returnedItems.length} item${order.returnedItems.length > 1 ? "s" : ""} returned`}
                                        </strong>
                                    </div>
                                    <div className="flex justify-between mb-1">
                                        <p>Return Date:</p>
                                        <strong>
                                            {order.returnedItems[0]?.returnedAt ? moment(order.returnedItems[0].returnedAt).format("DD MMMM YYYY [at] HH:mm") : "Not Available"}
                                        </strong>
                                    </div>
                                    <div className="flex justify-between mt-2 pt-2 border-t border-black">
                                        <p>Return Amount:</p>
                                        <strong>Rp{new Intl.NumberFormat('id-ID').format(order.returnAmount || 0)}</strong>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="p-4 rounded-lg text-gray-950 text-xs md:text-sm">
                                <h3 className="text-sm md:text-lg font-medium mb-1.5">Summary: </h3>

                                <div className="flex justify-between mt-2">
                                    <p>Total:</p>
                                    <strong>Rp{new Intl.NumberFormat('id-ID').format(order.totalPrice)}</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {userInfo.user.superAdmin && order.isPaid && (
                    <div className="mt-6">
                        <button
                            type="button"
                            className={`bg-red-500 text-white w-full py-2 rounded ${hideElements ? "hidden" : ""}`}
                            onClick={returnHandler}
                            disabled={loadingReturn}
                        >
                            {loadingReturn ? "Processing..." : "Return Selected Items"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default StoreOrder
