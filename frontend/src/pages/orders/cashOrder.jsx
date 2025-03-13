import { useEffect, useRef, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { useGetCashOrderDetailsQuery, useReturnCashOrderMutation } from "../../redux/api/orderApiSlice";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import moment from "moment";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import logo from '../../assets/galileo2.png';
import { FaDownload } from "react-icons/fa";

const CashOrder = () => {
  const { id: orderId } = useParams();
  const { data: cashOrder, refetch, isLoading, error } = useGetCashOrderDetailsQuery(orderId);
  const { userInfo } = useSelector((state) => state.auth);
  const [returnOrder, { isLoading: loadingReturn }] = useReturnCashOrderMutation();
  const invoiceRef = useRef();
  const [selectedItems, setSelectedItems] = useState([]);
  const [editedQuantities, setEditedQuantities] = useState({});
  const [selectAll, setSelectAll] = useState(false);
  const [showDownloadButton, setShowDownloadButton] = useState(true);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.key === 'p') {
        event.preventDefault();
        setShowDownloadButton(false);
        setTimeout(() => {
          window.print();
        }, 300);
      }
    };

    const handleBeforePrint = () => setShowDownloadButton(false);
    const handleAfterPrint = () => setShowDownloadButton(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  const handleDownloadPDF = useCallback(async () => {
    if (!invoiceRef.current) return;
  
    setShowDownloadButton(false);
  
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
  }, [orderId]);

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
    } else {
      const allItems = cashOrder.items.map((item) => ({
        product: item.product,
        quantity: item.quantity,
        price: item.price,
      }));
      setSelectedItems(allItems);
    }
    setSelectAll(!selectAll);
  };

  const toggleItemSelection = (item) => {
    setSelectedItems((prev) => {
      return prev.some((selected) => selected.product === item.product)
        ? prev.filter((selected) => selected.product !== item.product)
        : [...prev, { product: item.product, quantity: item.quantity, price: item.price }];
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
          product: item.product._id,
          quantity: editedQuantities[item.product._id] || item.quantity,
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
    <p>Loading...</p>
  ) : error ? (
    <p>Error: {error.data.message}</p>
  ) : (
    <div className="min-h-screen">
      <div className="flex justify-end sticky top-0 z-0">
          {showDownloadButton && (
            <button onClick={handleDownloadPDF} className="bg-blue-500 text-sm text-white font-bold px-2 py-2 mr-7 rounded-full">
              <FaDownload/>
            </button>
          )}
        </div>
      <div ref={invoiceRef} className="container mx-auto max-w-[85%] ml-[9%] mt-[1rem] relative bg-[#f0f0ef]">
        <div className="w-full p-2 relative">
          <img src={logo} alt="Logo" className="absolute top-0 md:top-0 left-2 w-[6rem] md:w-[12rem] h-auto" />
          <h2 className="text-black text-sm md:text-2xl font-medium mr-[2rem] mt-[1rem] mb-[2.5rem] text-right">INVOICE</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-gray-950 text-xs md:text-sm">
              <h3 className="font-bold text-sm md:text-xl md:mb-2.5 mb-0.5 mt-[1rem] md:mt-[5rem]">Order Information: </h3>
              <p className="mb-1">Order ID: {cashOrder._id}</p>
              <p className="mb-1">Payment On:  {moment(cashOrder.createdAt).format("DD MMMM YYYY")}</p>
              <p className="mb-1">Payment Status: {cashOrder.isPaid ?
                <span className="text-green-700">Paid on: {moment(cashOrder.paidAt).format("DD MMMM YYYY")}</span> :
                <span className="text-red-700">Cancelled</span>
              }</p>
            </div>

            <div className="text-gray-900 absolute md:top-[9.5rem]  right-[1rem] md:right-[7rem] text-xs md:text-sm">
              <h3 className="text-xs md:text-xl font-bold mb-0.5 md:mb-2.5">Published for: </h3>
              <p className="mb-1">Buyer: {cashOrder.customerName}</p>
              <p className="mb-1">Address: {cashOrder.address}</p>
              <p className="mb-1">Method: {cashOrder.paymentMethod}</p>
            </div>
          </div>

          <div className="overflow-x-auto mt-3">
            {cashOrder?.items?.length > 0 && (
              <div className="mt-4">
                <h3 className=" text-xs md:text-lg font-semibold mt-3 text-gray-950">Ordered Items: </h3>
                <table className="table-auto w-full text-gray-800 border-collapse">
                  <thead className="border-b-2 border-gray-400">
                    <tr className="text-xs md:text-sm">
                      {userInfo.user?.superAdmin && (
                        <th>
                          <input
                            type="checkbox"
                            checked={selectAll}
                            onChange={toggleSelectAll}
                            className="w-6 h-5 mt-2 cursor-pointer"
                          />
                        </th>
                      )}
                      <th className="p-2">Product</th>
                      <th className="p-2">Quantity</th>
                      <th className="p-2">Unit Price</th>
                      <th className="p-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cashOrder.items.map((item, index) => (
                      <tr key={index} className="text-center md:text-sm text-xs text-gray-950">
                        {userInfo.user.superAdmin && (
                          <td className="p-2">
                            <input
                              type="checkbox"
                              className="w-6 h-5 mt-3 cursor-pointer"
                              checked={selectedItems.some((selected) => selected.product === item.product)}
                              onChange={() => toggleItemSelection(item)}
                            />
                          </td>
                        )}
                        <td className="p-2">
                          <Link to={`/product/${item.product._id}`} className="text-gray-700 hover:text-gray-400">
                            {item.product.name}
                          </Link>
                        </td>
                        <td className="p-2">
                          {userInfo.user.superAdmin && selectedItems.some((selected) => selected.product === item.product) ? (
                            <input
                              type="number"
                              min="1"
                              max={item.quantity}
                              value={editedQuantities[item.product._id] || item.quantity}
                              onChange={(e) => handleQuantityChange(item.product._id, parseInt(e.target.value))}
                              className="w-16 text-center"
                            />
                          ) : (
                            item.quantity
                          )}
                        </td>
                        <td className="p-2">Rp{new Intl.NumberFormat('id-ID').format(item.product.price)}</td>
                        <td className="p-2">Rp{new Intl.NumberFormat('id-ID').format(item.quantity * item.product.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {cashOrder?.returnedItems?.length > 0 && (
            <div className="mt-4">
              <h3 className="text-xs md:text-lg font-semibold text-gray-700">Returned Items:</h3>
              <table className="table-auto w-full text-xs md:text-sm text-gray-800 border-collapse">
                <thead className="border-b-2 border-gray-400">
                  <tr className="text-gray-700 text-xs md:text-sm">
                    <th className="p-2">Product</th>
                    <th className="p-2">Quantity</th>
                    <th className="p-2">Unit Price</th>
                    <th className="p-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {cashOrder?.returnedItems.map((item, index) => (
                    <tr key={index} className="text-center text-gray-700">
                      <td className="p-2">
                        <Link to={`/product/${item.product}`} className="text-gray-700 hover:text-gray-400">
                          {item.name}
                        </Link>
                      </td>
                      <td className="p-2">{item.quantity}</td>
                      <td className="p-2">Rp{new Intl.NumberFormat('id-ID').format(item.price)}</td>
                      <td className="p-2">Rp{new Intl.NumberFormat('id-ID').format(item.quantity * item.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-[3rem] flex justify-between gap-4 text-sm md:text-md font-medium">
            <div className="flex-1">
              {cashOrder.returnedItems && cashOrder.returnedItems.length > 0 && (
                <div className="p-4 rounded-lg text-gray-800">
                  <h3 className="text-sm md:text-lg font-medium mb-1.5">Return Details: </h3>
                  <div className="flex justify-between mb-1">
                    <span>Return Status:</span>
                    <span>  {cashOrder.items.length === 0
                      ? "true"
                      : `${cashOrder.returnedItems.length} item${cashOrder.returnedItems.length > 1 ? "s" : ""} returned`}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span>Return Date:</span>
                    <span>
                      {cashOrder.returnedItems[0]?.returnedAt
                        ? moment(cashOrder.returnedItems[0].returnedAt).format("DD MMMM YYYY")
                        : "Not Available"}</span>
                  </div>
                  <div className="flex justify-between font-bold mt-2 pt-2 border-t border-black">
                    <span>Return Amount:</span>
                    <span>Rp{new Intl.NumberFormat('id-ID').format(cashOrder.returnAmount || 0)}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="p-4 rounded-lg text-gray-800">
                <h3 className="text-sm md:text-lg font-medium mb-1.5">Summary: </h3>
                <div className="flex justify-between mb-1">
                  <span>Total Amount:</span>
                  <span>Rp{new Intl.NumberFormat('id-ID').format(cashOrder.totalAmount)}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>TAX (PPN 11%):</span>
                  <span>Rp{new Intl.NumberFormat('id-ID').format(cashOrder.taxPrice)}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Received Amount:</span>
                  <span>Rp{new Intl.NumberFormat('id-ID').format(cashOrder.receivedAmount)}</span>
                </div>
                {cashOrder.discount > 0 && (
                  <div className="flex justify-between mb-1">
                    <span>Discount:</span>
                    <span>Rp{cashOrder.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold mt-2 pt-2 border-t border-black">
                  <span>Change:</span>
                  <span>Rp{new Intl.NumberFormat('id-ID').format(cashOrder.change)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {userInfo.user.superAdmin && cashOrder.isPaid && (
          <div className="mt-6">
            <button
              type="button"
              className="bg-red-500 text-white w-full py-2 rounded"
              onClick={returnHandler}
              disabled={loadingReturn}
            >
              {loadingReturn ? "Processing..." : "Return Selected Items"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CashOrder;