import asyncHandler from "express-async-handler";
import Product from "../models/product.js";
import snap from "../config/midtrans.js";
import OrderStore from "../models/orderStore.js";
import User from "../models/user.js";

function calcPrice(orderItems, membership) {
  const itemsPrice = orderItems.reduce(
    (acc, item) => acc + item.price * item.qty,
    0
  );

  let discountRate = 0;
  if (membership === "Platinum") {
    discountRate = 0.07;
  } else if (membership === "Gold") {
    discountRate = 0.05;
  } else if (membership === "Silver") {
    discountRate = 0.03;
  }

  const discount = itemsPrice * discountRate;
  const totalPrice = Math.round(itemsPrice - discount);

  return {
    totalPrice: Math.round(totalPrice),
    discount: Math.round(discount),
  };
}

export const createInStoreOrder = asyncHandler(async (req, res) => {
  const {
    orderItems,
    paymentMethod,
    membership,
    membershipName,
    membershipPhone,
    membershipEmail,
  } = req.body;

  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error("No order items");
  }

  const itemsFromDB = await Product.find({
    _id: { $in: orderItems.map((x) => x._id) },
  });

  const dbOrderItems = orderItems.map((itemsFromClient, index) => {
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
      key: index,
    };
  });

  const { totalPrice, discount } = calcPrice(dbOrderItems, membership);

  const order = new OrderStore({
    orderItems: dbOrderItems,
    user: req.user._id,
    membership,
    paymentMethod,
    totalPrice,
    membershipName,
    membershipPhone,
    membershipEmail,
  });

  const createdOrder = await order.save();
  const orderId = createdOrder.id;

  const orderDetails = {
    transaction_details: {
      order_id: orderId,
      gross_amount: totalPrice,
    },
    customer_details: {
      first_name: membershipName || req.user.username,
      email: membershipEmail || req.user.email,
      phone: membershipPhone || "none",
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
    console.error("Error creating in-store order:", error);
    res
      .status(500)
      .json({ message: "Failed to create order", error: error.message });
  }
});

export const getUserMembership = asyncHandler(async (req, res) => {
  const { phone } = req.params;

  const user = await User.findOne({ phone }).select(
    "membership username point phone email"
  );

  if (!user) {
    return res.status(404).json({ message: "user not found" });
  }
  res.json({
    membership: user.membership,
    username: user.username,
    point: user.point,
    phone: user.phone,
    email: user.email,
  });
});

export const markOrderIsPay = asyncHandler(async (req, res) => {
  const order = await OrderStore.findById(req.params.id).populate(
    "user",
    "username"
  );

  if (order) {
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
        if (product) {
          product.countInStock -= item.qty;
          product.sold += item.qty;

          if (product.countInStock < 0) {
            res.status(400);
            throw new Error(`Stock insufficient for product: ${product.name}`);
          }

          await product.save();
        } else {
          res.status(404);
          throw new Error(`Product not found: ${item.product}`);
        }
      })
    );

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error("Order not found");
  }
});

export const calcTotalIncomeStore = asyncHandler(async (req, res) => {
  try {
    const orders = await OrderStore.find({ isPaid: true }).populate(
      "orderItems.product"
    );

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

export const calcTotalProfitByWeekStore = asyncHandler(async (req, res) => {
  try {
    const profitByWeekOrderStore = await OrderStore.aggregate([
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
            $sum: {
              $multiply: ["$productDetails.purchasePrice", "$orderItems.qty"],
            },
          },
        },
      },
      {
        $project: {
          totalProfit: {
            $round: [
              {
                $subtract: ["$totalItemsPrice", "$totalPurchasePrice"],
              },
              0,
            ],
          },
        },
      },
    ]);

    res.json(profitByWeekOrderStore);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error calculating profit by date.",
      error: error.message,
    });
  }
});

export const calcTotalProfitByDateStore = asyncHandler(async (req, res) => {
  try {
    const profitByDateOrderStore = await OrderStore.aggregate([
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
            $sum: {
              $multiply: ["$productDetails.purchasePrice", "$orderItems.qty"],
            },
          },
        },
      },
      {
        $project: {
          totalProfit: {
            $round: [
              {
                $subtract: ["$totalItemsPrice", "$totalPurchasePrice"],
              },
              0,
            ],
          },
        },
      },
    ]);

    res.json(profitByDateOrderStore);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error calculating profit by date.",
      error: error.message,
    });
  }
});

export const calcTotalProfitByMonthStore = asyncHandler(async (req, res) => {
  try {
    const profitByMonthOrderStore = await OrderStore.aggregate([
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
            $sum: {
              $multiply: ["$productDetails.purchasePrice", "$orderItems.qty"],
            },
          },
        },
      },
      {
        $project: {
          totalProfit: {
            $round: [
              {
                $subtract: ["$totalItemsPrice", "$totalPurchasePrice"],
              },
              0,
            ],
          },
        },
      },
    ]);

    res.json(profitByMonthOrderStore);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error calculating profit by date.",
      error: error.message,
    });
  }
});

export const calcTotalProfitByYearStore = asyncHandler(async (req, res) => {
  try {
    const profitByYearOrderStore = await OrderStore.aggregate([
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
            $sum: {
              $multiply: ["$productDetails.purchasePrice", "$orderItems.qty"],
            },
          },
        },
      },
      {
        $project: {
          totalProfit: {
            $round: [
              {
                $subtract: ["$totalItemsPrice", "$totalPurchasePrice"],
              },
              0,
            ],
          },
        },
      },
    ]);

    res.json(profitByYearOrderStore);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error calculating profit by date.",
      error: error.message,
    });
  }
});

export const getAllStoreOrder = asyncHandler(async (req, res) => {
  const orderStore = await OrderStore.find({}).populate("user", "id username");
  res.json(orderStore);
});

export const findOrderById = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const order = await OrderStore.findById(id).populate("user", "username");
  if (order) {
    res.json(order);
  } else {
    res.status(404).json("order not found");
  }
});

export const markOrderAsReturned = asyncHandler(async (req, res) => {
  const { returnedItems } = req.body;
  const order = await OrderStore.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (!order.isPaid) {
    res.status(400);
    throw new Error("Order has not been paid yet");
  }

  let totalRefund = 0;

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
    productData.sold += qty;
    await productData.save();

    const refundAmount = item.price * qty;
    totalRefund += refundAmount;

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

  order.totalPrice = Math.max(order.totalPrice - totalRefund, 0);
  order.returnAmount += totalRefund;

  if (order.orderItems.length === 0) {
    order.isReturned = true;
    order.isPaid = false;
    order.totalPrice = 0;
  }

  const updatedOrder = await order.save();
  res.json(updatedOrder);
});
