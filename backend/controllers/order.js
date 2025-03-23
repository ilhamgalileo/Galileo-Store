import Order from "../models/order.js";
import Product from "../models/product.js";
import asyncHandler from "express-async-handler";
import snap from "../config/midtrans.js";
import CashOrder from "../models/cashOrder.js";
import OrderStore from "../models/orderStore.js";
import User from "../models/user.js";

function calcPrice(orderItems, membership) {
  const itemsPrice = orderItems.reduce(
    (acc, item) => acc + item.price * item.qty,
    0
  );

  const totalWeight = orderItems.reduce(
    (acc, item) => acc + (item.weight || 0) * item.qty,
    0
  );

  let shippingPrice = 0;
  if (membership !== "Platinum") {
    shippingPrice =
      totalWeight < 1000 ? 0 : Math.ceil(totalWeight / 1000) * 15000;
  }

  let discountRate = 0;
  if (membership === "Platinum") {
    discountRate = 0.07;
  } else if (membership === "Gold") {
    discountRate = 0.05;
  } else if (membership === "Silver") {
    discountRate = 0.03;
  }

  const discount = Math.round(itemsPrice * discountRate);
  const totalPrice = Math.round(itemsPrice - discount);
  const bill = Math.round(totalPrice + shippingPrice)

  return {
    itemsPrice: Math.round(itemsPrice),
    shippingPrice: Math.round(shippingPrice),
    discount: Math.round(discount),
    totalPrice: Math.round(totalPrice),
    bill
  };
}

export const createOrder = asyncHandler(async (req, res) => {
  const { orderItems, shippingAddress, paymentMethod, membership, phone } = req.body;

  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error("No order items");
  }

  const itemsFromDB = await Product.find({
    _id: { $in: orderItems.map((x) => x._id) },
  });

  const dbOrderItems = orderItems.map((itemsFromClient) => {
    const matchingItemFromDB = itemsFromDB.find(
      (item) => item._id.toString() === itemsFromClient._id
    );

    if (!matchingItemFromDB) {
      res.status(404);
      throw new Error(`Product not found: ${itemsFromClient._id}`);
    }

    return {
      ...itemsFromClient,
      product: itemsFromClient._id,
      price: matchingItemFromDB.price,
      _id: undefined,
    };
  });

  const { itemsPrice, shippingPrice, totalPrice, discount, bill } = calcPrice(
    dbOrderItems,
    membership
  );

  const order = new Order({
    orderItems: dbOrderItems,
    user: req.user._id,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    discount,
    shippingPrice,
    membership,
    totalPrice,
    phone,
    bill
  });

  const createdOrder = await order.save();
  const orderId = createdOrder.id;

  const orderDetails = {
    transaction_details: {
      order_id: orderId,
      gross_amount: bill,
    },
    customer_details: {
      first_name: req.user.username,
      email: req.user.email,
      phone: phone,
      billing_address: {
        first_name: req.user.username,
        city: shippingAddress.city,
      },
      shipping_address: {
        first_name: req.user.username,
        address: shippingAddress.detail_address,
        city: `${shippingAddress.city}, ${shippingAddress.province},`,
        postal_code: shippingAddress.postalCode,
      },
    },
    item_details: [
      ...dbOrderItems.map((item) => ({
        id: item.product,
        price: item.price,
        quantity: item.qty,
        name: item.name,
      })),
      ...(discount > 0
        ? [
            {
              id: "DISCOUNT",
              price: -discount,
              quantity: 1,
              name: `Discount ${membership} Member`,
            },
          ]
        : []),
      ...(shippingPrice > 0
        ? [
            {
              id: "SHIPPING",
              price: shippingPrice,
              quantity: 1,
              name: "Shipping Fee",
            },
          ]
        : []),
    ],
  };

  try {
    const response = await snap.createTransaction(orderDetails);

    if (!response.token) {
      throw new Error("Midtrans did not return a payment token");
    }

    createdOrder.paymentToken = response.token;
    createdOrder.paymentUrl = response.redirect_url;
    await createdOrder.save();

    res.status(201).json({
      order: createdOrder,
      token: response.token,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res
      .status(500)
      .json({ message: "Failed to create order", error: error.message });
  }
});

export const getAllOrder = asyncHandler(async (req, res) => {
  const orders = await Order.find({}).populate("user", "id username");
  res.json(orders);
});

export const getAllCombinedOrders = asyncHandler(async (req, res) => {
  const [orders, cashOrders, orderStore] = await Promise.all([
    Order.find({}).populate("user", "id username").sort({ createdAt: -1 }),
    CashOrder.find({})
      .populate("items.product", "name price images")
      .sort({ createdAt: -1 }),
    OrderStore.find({}).populate("user", "id username").sort({ createdAt: -1 }),
    ,
  ]);

  res.json({
    orders,
    cashOrders,
    orderStore,
  });
});

export const getMyOrder = asyncHandler(async (req, res) => {
  const id = req.user._id;
  const myOder = await Order.find({ user: id }).sort({ createdAt: -1 });
  res.json(myOder);
});

export const calcTotalIncomeCombine = asyncHandler(async (req, res) => {
  try {
    const orders = await Order.find({ isPaid: true }).populate("orderItems.product");
    const cashOrders = await CashOrder.find({ isPaid: true }).populate("items.product");
    const storeOrders = await OrderStore.find({ isPaid: true }).populate("orderItems.product");

    const calculateProfit = (orders, isCash = false, isStore = false) => {
      return orders.reduce((totalIncome, order) => {
        const items = isCash ? order.items : order.orderItems;

        const totalPurchasePrice = items.reduce((acc, item) => {
          const purchasePrice = item.product.purchasePrice || 0;
          return acc + purchasePrice * (isCash ? item.quantity : item.qty);
        }, 0);

        const itemsPrice = items.reduce((acc, item) => {
          return acc + item.price * (isCash ? item.quantity : item.qty);
        }, 0);

        let discountRate = 0;
        if (!isStore) {
          if (order.membership === "Platinum") {
            discountRate = 0.07;
          } else if (order.membership === "Gold") {
            discountRate = 0.05;
          } else if (order.membership === "Silver") {
            discountRate = 0.03;
          }
        }

        const discount = itemsPrice * discountRate;
        const totalPrice = itemsPrice - discount;
        const profit = Math.round(totalPrice - totalPurchasePrice);

        return totalIncome + profit;
      }, 0);
    };

    const totalOrderIncome = calculateProfit(orders);
    const totalCashIncome = calculateProfit(cashOrders, true);
    const totalStoreIncome = calculateProfit(storeOrders, false, true);
    const totalIncome = totalOrderIncome + totalCashIncome + totalStoreIncome;

    res.json({
      order: totalOrderIncome,
      cash: totalCashIncome,
      store: totalStoreIncome,
      totalProfit: totalIncome,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error calculating income.",
      error: error.message,
    });
  }
});

export const calcTotalIncome = asyncHandler(async (req, res) => {
  try {
    const orders = await Order.find({ isPaid: true }).populate("orderItems.product");

    let totalIncome = 0;

    orders.forEach((order) => {
      const totalPurchasePrice = order.orderItems.reduce((acc, item) => {
        const purchasePrice = item.product.purchasePrice || 0;
        return acc + purchasePrice * item.qty;
      }, 0);

      const itemsPrice = order.orderItems.reduce((acc, item) => {
        return acc + item.price * item.qty;
      }, 0);

      let discountRate = 0;
      if (order.membership === "Platinum") {
        discountRate = 0.07;
      } else if (order.membership === "Gold") {
        discountRate = 0.05;
      } else if (order.membership === "Silver") {
        discountRate = 0.03;
      }

      const discount = itemsPrice * discountRate;

      const totalPrice = itemsPrice - discount;

      const profit = Math.round(totalPrice - totalPurchasePrice);

      totalIncome += profit;
    });

    res.json({
      success: true,
      totalProfit: totalIncome,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error calculating income.",
      error: error.message,
    });
  }
});

export const countTotalOrders = asyncHandler(async (req, res) => {
  const [totalTransferOrders, totalCashOrders, totalOrderStore] =
    await Promise.all([
      Order.countDocuments(),
      CashOrder.countDocuments(),
      OrderStore.countDocuments(),
    ]);

  const totalCombinedOrders =
    totalTransferOrders + totalCashOrders + totalOrderStore;

  res.json({ totalOrders: totalCombinedOrders });
});

export const calcTotalProfitByDate = asyncHandler(async (req, res) => {
  try {
    const profitByDateOrder = await Order.aggregate([
      {
        $match: { isPaid: true }, 
      },
      {
        $unwind: "$orderItems", 
      },
      {
        $lookup: {
          from: "products",
          localField: "orderItems.product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: "$productDetails",
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$paidAt" }, 
          },
          totalItemsPrice: {
            $sum: { $multiply: ["$orderItems.price", "$orderItems.qty"] }, 
          },
          totalPurchasePrice: {
            $sum: { $multiply: ["$productDetails.purchasePrice", "$orderItems.qty"] },
          },
          totalDiscount: {
            $sum: {
              $multiply: [
                { $multiply: ["$orderItems.price", "$orderItems.qty"] },
                {
                  $cond: [
                    { $eq: ["$membership", "Platinum"] },
                    0.07,
                    {
                      $cond: [
                        { $eq: ["$membership", "Gold"] },
                        0.05,
                        { $cond: [{ $eq: ["$membership", "Silver"] }, 0.03, 0] },
                      ],
                    },
                  ],
                },
              ],
            },
          },
        },
      },
      {
        $project: {
          totalProfit: {
            $round: [
              {
                $subtract: [
                  { $subtract: ["$totalItemsPrice", "$totalDiscount"] },
                  "$totalPurchasePrice",
                ],
              },
              0,
            ],
          },
        },
      },
    ]);

    res.json(profitByDateOrder);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error calculating profit by date.",
      error: error.message,
    });
  }
});

export const calcTotalProfitByYear = asyncHandler(async (req, res) => {
  try {
    const profitByYearOrder = await Order.aggregate([
      {
        $match: { isPaid: true }, 
      },
      {
        $unwind: "$orderItems", 
      },
      {
        $lookup: {
          from: "products",
          localField: "orderItems.product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: "$productDetails",
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y", date: "$paidAt" }, 
          },
          totalItemsPrice: {
            $sum: { $multiply: ["$orderItems.price", "$orderItems.qty"] }, 
          },
          totalPurchasePrice: {
            $sum: { $multiply: ["$productDetails.purchasePrice", "$orderItems.qty"] },
          },
          totalDiscount: {
            $sum: {
              $multiply: [
                { $multiply: ["$orderItems.price", "$orderItems.qty"] },
                {
                  $cond: [
                    { $eq: ["$membership", "Platinum"] },
                    0.07,
                    {
                      $cond: [
                        { $eq: ["$membership", "Gold"] },
                        0.05,
                        { $cond: [{ $eq: ["$membership", "Silver"] }, 0.03, 0] },
                      ],
                    },
                  ],
                },
              ],
            },
          },
        },
      },
      {
        $project: {
          totalProfit: {
            $round: [
              {
                $subtract: [
                  { $subtract: ["$totalItemsPrice", "$totalDiscount"] },
                  "$totalPurchasePrice",
                ],
              },
              0,
            ],
          },
        },
      },
    ]);

    res.json(profitByYearOrder);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error calculating profit by date.",
      error: error.message,
    });
  }
});

export const calcTotalProfitByMonth = asyncHandler(async (req, res) => {
  try {
    const profitByMonthOrder = await Order.aggregate([
      {
        $match: { isPaid: true }, 
      },
      {
        $unwind: "$orderItems", 
      },
      {
        $lookup: {
          from: "products",
          localField: "orderItems.product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: "$productDetails",
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m", date: "$paidAt" }, 
          },
          totalItemsPrice: {
            $sum: { $multiply: ["$orderItems.price", "$orderItems.qty"] }, 
          },
          totalPurchasePrice: {
            $sum: { $multiply: ["$productDetails.purchasePrice", "$orderItems.qty"] },
          },
          totalDiscount: {
            $sum: {
              $multiply: [
                { $multiply: ["$orderItems.price", "$orderItems.qty"] },
                {
                  $cond: [
                    { $eq: ["$membership", "Platinum"] },
                    0.07,
                    {
                      $cond: [
                        { $eq: ["$membership", "Gold"] },
                        0.05,
                        { $cond: [{ $eq: ["$membership", "Silver"] }, 0.03, 0] },
                      ],
                    },
                  ],
                },
              ],
            },
          },
        },
      },
      {
        $project: {
          totalProfit: {
            $round: [
              {
                $subtract: [
                  { $subtract: ["$totalItemsPrice", "$totalDiscount"] },
                  "$totalPurchasePrice",
                ],
              },
              0,
            ],
          },
        },
      },
    ]);

    res.json(profitByMonthOrder);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error calculating profit by date.",
      error: error.message,
    });
  }
});

export const calcTotalProfitByWeek = asyncHandler(async (req, res) => {
  try {
    const profitByWeekOrder = await Order.aggregate([
      {
        $match: { isPaid: true }, 
      },
      {
        $unwind: "$orderItems", 
      },
      {
        $lookup: {
          from: "products",
          localField: "orderItems.product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: "$productDetails",
      },
      {
        $group: {
          _id: {
            month: { $dateToString: { format: "%Y-%m", date: "$paidAt" } },
            week: { $ceil: { $divide: [{ $dayOfMonth: "$paidAt" }, 7] } },
          },
          totalItemsPrice: {
            $sum: { $multiply: ["$orderItems.price", "$orderItems.qty"] }, 
          },
          totalPurchasePrice: {
            $sum: { $multiply: ["$productDetails.purchasePrice", "$orderItems.qty"] },
          },
          totalDiscount: {
            $sum: {
              $multiply: [
                { $multiply: ["$orderItems.price", "$orderItems.qty"] },
                {
                  $cond: [
                    { $eq: ["$membership", "Platinum"] },
                    0.07,
                    {
                      $cond: [
                        { $eq: ["$membership", "Gold"] },
                        0.05,
                        { $cond: [{ $eq: ["$membership", "Silver"] }, 0.03, 0] },
                      ],
                    },
                  ],
                },
              ],
            },
          },
        },
      },
      {
        $project: {
          totalProfit: {
            $round: [
              {
                $subtract: [
                  { $subtract: ["$totalItemsPrice", "$totalDiscount"] },
                  "$totalPurchasePrice",
                ],
              },
              0,
            ],
          },
        },
      },
    ]);

    res.json(profitByWeekOrder);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error calculating profit by date.",
      error: error.message,
    });
  }
});

export const calcTotalSales = asyncHandler(async (req, res) => {
  const [orders, cashOrders, storeOrders] = await Promise.all([
    Order.find({ isPaid: true }),
    CashOrder.find({ isPaid: true }),
    OrderStore.find({ isPaid: true }),
  ]);

  const totalSales =
    orders.reduce((sum, order) => sum + order.totalPrice, 0) +
    cashOrders.reduce((sum, cashOrder) => sum + cashOrder.totalAmount, 0) +
    storeOrders.reduce((sum, storeOrders) => sum + storeOrders.totalPrice, 0);

  res.json({ totalSales });
});

export const calcTotalSalesByDate = asyncHandler(async (req, res) => {
  const [salesByDateOrder, salesByDateStoreOrder, salesByDateCashOrder] =
    await Promise.all([
      Order.aggregate([
        {
          $match: { isPaid: true },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$paidAt" },
            },
            totalSales: { $sum: "$totalPrice" },
          },
        },
      ]),
      OrderStore.aggregate([
        {
          $match: { isPaid: true },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$paidAt" },
            },
            totalSales: { $sum: "$totalPrice" },
          },
        },
      ]),
      CashOrder.aggregate([
        {
          $match: { isPaid: true },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            totalSales: { $sum: "$totalAmount" },
          },
        },
      ]),
    ]);

  const mergedSales = [
    ...salesByDateOrder,
    ...salesByDateStoreOrder,
    ...salesByDateCashOrder,
  ].reduce((acc, sale) => {
    const existing = acc.find((item) => item._id === sale._id);
    if (existing) {
      existing.totalSales += sale.totalSales;
    } else {
      acc.push(sale);
    }
    return acc;
  }, []);

  res.json(mergedSales);
});

export const calcTotalSalesByMonth = asyncHandler(async (req, res) => {
  const [salesByMonthOrder, salesByMonthStoreOrder, salesByMonthCashOrder] =
    await Promise.all([
      Order.aggregate([
        {
          $match: { isPaid: true },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m", date: "$paidAt" },
            },
            totalSales: { $sum: "$totalPrice" },
          },
        },
      ]),
      OrderStore.aggregate([
        {
          $match: { isPaid: true },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m", date: "$paidAt" },
            },
            totalSales: { $sum: "$totalPrice" },
          },
        },
      ]),
      CashOrder.aggregate([
        {
          $match: { isPaid: true },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m", date: "$createdAt" },
            },
            totalSales: { $sum: "$totalAmount" },
          },
        },
      ]),
    ]);

  const mergedSales = [
    ...salesByMonthOrder,
    ...salesByMonthStoreOrder,
    ...salesByMonthCashOrder,
  ].reduce((acc, sale) => {
    const existing = acc.find((item) => item._id === sale._id);
    if (existing) {
      existing.totalSales += sale.totalSales;
    } else {
      acc.push(sale);
    }
    return acc;
  }, []);

  res.json(mergedSales);
});

export const calcTotalSalesByYear = asyncHandler(async (req, res) => {
  const [salesByMonthOrder, salesByMonthStoreOrder, salesByMonthCashOrder] =
    await Promise.all([
      Order.aggregate([
        {
          $match: { isPaid: true },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y", date: "$paidAt" },
            },
            totalSales: { $sum: "$totalPrice" },
          },
        },
      ]),
      OrderStore.aggregate([
        {
          $match: { isPaid: true },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y", date: "$paidAt" },
            },
            totalSales: { $sum: "$totalPrice" },
          },
        },
      ]),
      CashOrder.aggregate([
        {
          $match: { isPaid: true },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y", date: "$createdAt" },
            },
            totalSales: { $sum: "$totalAmount" },
          },
        },
      ]),
    ]);

  const mergedSales = [
    ...salesByMonthOrder,
    ...salesByMonthStoreOrder,
    ...salesByMonthCashOrder,
  ].reduce((acc, sale) => {
    const existing = acc.find((item) => item._id === sale._id);
    if (existing) {
      existing.totalSales += sale.totalSales;
    } else {
      acc.push(sale);
    }
    return acc;
  }, []);

  res.json(mergedSales);
});

export const calcTotalSalesByWeek = asyncHandler(async (req, res) => {
  const [salesByMonthOrder, salesByMonthStoreOrder, salesByMonthCashOrder] =
    await Promise.all([
      Order.aggregate([
        { $match: { isPaid: true } },
        {
          $group: {
            _id: {
              month: { $dateToString: { format: "%Y-%m", date: "$paidAt" } },
              week: { $ceil: { $divide: [{ $dayOfMonth: "$paidAt" }, 7] } },
            },
            totalSales: { $sum: "$totalPrice" },
          },
        },
        {
          $project: {
            _id: {
              $concat: ["$_id.month", "-", { $toString: "$_id.week" }],
            },
            totalSales: 1,
          },
        },
      ]),
      OrderStore.aggregate([
        { $match: { isPaid: true } },
        {
          $group: {
            _id: {
              month: { $dateToString: { format: "%Y-%m", date: "$paidAt" } },
              week: { $ceil: { $divide: [{ $dayOfMonth: "$paidAt" }, 7] } },
            },
            totalSales: { $sum: "$totalPrice" },
          },
        },
        {
          $project: {
            _id: {
              $concat: ["$_id.month", "-", { $toString: "$_id.week" }],
            },
            totalSales: 1,
          },
        },
      ]),
      CashOrder.aggregate([
        { $match: { isPaid: true } },
        {
          $group: {
            _id: {
              month: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
              week: { $ceil: { $divide: [{ $dayOfMonth: "$createdAt" }, 7] } },
            },
            totalSales: { $sum: "$totalAmount" },
          },
        },
        {
          $project: {
            _id: {
              $concat: ["$_id.month", "-", { $toString: "$_id.week" }],
            },
            totalSales: 1,
          },
        },
      ]),
    ]);

  const mergedSales = [
    ...salesByMonthOrder,
    ...salesByMonthStoreOrder,
    ...salesByMonthCashOrder,
  ].reduce((acc, sale) => {
    const existing = acc.find((item) => item._id === sale._id);
    if (existing) {
      existing.totalSales += sale.totalSales;
    } else {
      acc.push(sale);
    }
    return acc;
  }, []);

  mergedSales.sort((a, b) => {
    const [aYearMonth, aWeek] = a._id.split("-");
    const [bYearMonth, bWeek] = b._id.split("-");
    return (
      aYearMonth.localeCompare(bYearMonth) || parseInt(aWeek) - parseInt(bWeek)
    );
  });

  res.json(mergedSales);
});

export const findOrderById = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const order = await Order.findById(id).populate("user", "username email");
  if (order) {
    res.json(order);
  } else {
    res.status(404).json("order not found");
  }
});

export const markOrderIsPay = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    "user",
    "point membership"
  );

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  const { status, updatedAt, id, payment_type } = req.body;

  order.isPaid = true;
  order.paidAt = Date.now();
  order.paymentMethod = payment_type;
  order.paymentResult = {
    status,
    update_time: updatedAt,
    id,
  };

  await Promise.all(
    order.orderItems.map(async (item) => {
      const product = await Product.findById(item.product);
      if (!product) {
        res.status(404);
        throw new Error(`Product not found: ${item.product}`);
      }

      if (product.countInStock < item.qty) {
        res.status(400);
        throw new Error(`Stock insufficient for product: ${product.name}`);
      }

      product.countInStock -= item.qty;
      product.sold += item.qty;
      await product.save();
    })
  );

  await order.save();

  if (order.user) {
    const user = await User.findById(order.user._id);
    if (user) {
      const pointsEarned = Math.round(order.totalPrice / 1000);
      user.point = (user.point || 0) + pointsEarned;
      user.updateMembership();
  
      await user.save();
    }
  }

  res.json(order);
});

export const markOrderAsReturned = asyncHandler(async (req, res) => {
  const { returnedItems } = req.body;
  const order = await Order.findById(req.params.id).populate("user", "point membership");

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (!order.isPaid) {
    res.status(400);
    throw new Error("Order has not been paid yet");
  }

  let totalRefund = 0;
  let weightRefund = 0;

  let discountRate = 0;
  if (order.user.membership === "Platinum") {
    discountRate = 0.07;
  } else if (order.user.membership === "Gold") {
    discountRate = 0.05;
  } else if (order.user.membership === "Silver") {
    discountRate = 0.03;
  }

  for (const returnedItem of returnedItems) {
    const { product, qty } = returnedItem;

    const itemIndex = order.orderItems.findIndex(
      (item) => item.product.toString() === product
    );
    if (itemIndex === -1) {
      res.status(404);
      throw new Error(`Product ${product} not found in order`);
    }

    const item = order.orderItems[itemIndex];

    if (qty > item.qty) {
      res.status(400);
      throw new Error(
        `Return quantity exceeds purchased quantity for product ${product}`
      );
    }

    const productData = await Product.findById(product);
    if (!productData) {
      res.status(404);
      throw new Error(`Product ${product} not found`);
    }

    productData.countInStock += qty;
    productData.sold = Math.max(productData.sold - qty, 0);
    await productData.save();

    const refundAmount = item.price * qty * (1 - discountRate);
    totalRefund += refundAmount;
    weightRefund += (item.weight || 0) * qty;

    order.returnedItems.push({
      product: item.product,
      name: item.name,
      price: item.price,
      qty,
      returnedAt: new Date(),
    });

    item.qty -= qty;
    if (item.qty === 0) {
      order.orderItems.splice(itemIndex, 1);
    }
  }

  if (!order.isDelivered) {
    const totalWeight = order.orderItems.reduce(
      (acc, item) => acc + (item.weight || 0) * item.qty,
      0
    );

    const newShippingPrice =
      totalWeight < 1000 ? 0 : Math.ceil(totalWeight / 1000) * 15000;

    const shippingRefund = order.shippingPrice - newShippingPrice;
    totalRefund += shippingRefund; 
    order.shippingPrice = newShippingPrice; 
  }

  order.totalPrice = Math.max(order.totalPrice - totalRefund, 0);
  order.returnAmount = Math.round((order.returnAmount || 0) + totalRefund);

  if (order.orderItems.length === 0) {
    order.isReturned = true;
    order.isPaid = false;
    order.totalPrice = 0;
    order.itemsPrice = 0;
  }

  await order.save();

  if (order.user) {
    const pointReduction = Math.round(totalRefund / 1000);
    order.user.point = Math.max((order.user.point || 0) - pointReduction, 0);

    order.user.updateMembership();

    await order.user.save();
  }

  res.json(order);
});

export const markOrderIsDeliver = asyncHandler(async (req, res) => {
  const id = req.params.id;

  const order = await Order.findById(id);
  if (order) {
    order.isDelivered = true;
    order.deliveredAt = Date.now();

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404).json("order not found");
  }
});
