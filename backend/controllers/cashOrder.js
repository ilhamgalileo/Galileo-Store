import asyncHandler from "../middlewares/asyncHandler.js";
import CashOrder from "../models/cashOrder.js";
import Product from "../models/product.js";
import User from "../models/user.js";

export const createCashOrder = async (req, res) => {
  const {
    customerName,
    phone,
    cust_address,
    orderItems,
    receivedAmount,
    membership,
    customerMemberName
  } = req.body;

  if (!receivedAmount) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const validatedItems = [];
    let calculatedTotal = 0;

    for (const item of orderItems) {
      const product = await Product.findById(item.product);

      if (!product) {
        return res.status(404).json({
          message: `Product not found with ID: ${item.product}`,
        });
      }

      if (product.price !== item.price) {
        return res.status(400).json({
          message: `Invalid price for product: ${product.name}`,
        });
      }

      calculatedTotal += product.price * item.quantity;

      validatedItems.push({
        product: item.product,
        name: product.name,
        quantity: item.quantity,
        price: product.price,
      });
    }

    let discount = 0;
    switch (membership) {
      case "Platinum":
        discount = calculatedTotal * 0.07;
        break;
      case "Gold":
        discount = calculatedTotal * 0.05;
        break;
      case "Silver":
        discount = calculatedTotal * 0.03;
        break;
      default:
        discount = 0;
    }

    const totalAmount = Math.round(calculatedTotal - discount);

    if (receivedAmount < totalAmount) {
      return res.status(400).json({
        message:
          "Received amount must be greater than or equal to total amount",
      });
    }

    const cashOrder = await CashOrder.create({
      cashier: req.user._id,
      customerName: customerName,
      customerMemberName,
      phone,
      address: cust_address,
      items: validatedItems,
      totalAmount,
      receivedAmount,
      discount,
      change: receivedAmount - totalAmount,
      isPaid: true,
      paidAt: new Date(),
      membership,
    });

    for (const item of validatedItems) {
      const product = await Product.findById(item.product);
      if (product.countInStock < item.quantity) {
        return res.status(400).json({
          message: `Not enough stock for product: ${product.name}`,
        });
      }
      product.countInStock -= item.quantity;
      product.sold += item.quantity;
      await product.save();
    }

    res.status(201).json({
      _id: cashOrder._id,
      message: "Order created successfully",
      order: cashOrder,
      discount,
      totalAmount,
    });
  } catch (error) {
    console.error("Create cash order error:", error);
    res.status(500).json({
      message: "Failed to create order",
      error: error.message,
    });
  }
};

export const getAllOrderCash = asyncHandler(async (req, res) => {
  const orders = await CashOrder.find({}).populate("items.product", "name");
  res.json({ orders });
});

export const getUserMembership = asyncHandler(async (req, res) => {
  const { phone } = req.params;

  const user = await User.findOne({ phone }).select("membership username");

  if (!user) {
    return res.status(404).json({ message: "user not found" });
  }
  res.json({ membership: user.membership, username: user.username, });
});

export const getCashOrderById = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const data = await CashOrder.findById(id)
    .populate("items.product", "name price images")
    .populate("cashier", "username");

  if (data) {
    res.send(data);
  } else {
    res.status(500).send({ message: "Order not found with id " + id });
  }
});

export const calcTotalIncomeCash = asyncHandler(async (req, res) => {
  try {
    const orders = await CashOrder.find({ isPaid: true }).populate(
      "items.product"
    );

    let totalIncome = 0;

    orders.forEach((order) => {
      const totalPurchasePrice = order.items.reduce((acc, item) => {
        const purchasePrice = item.product.purchasePrice || 0;
        return acc + purchasePrice * item.quantity;
      }, 0);

      const itemsPrice = order.items.reduce((acc, item) => {
        return acc + item.price * item.quantity;
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

      Math.round((totalIncome += profit));
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

export const calcTotalProfitByDateCash = asyncHandler(async (req, res) => {
  try {
    const profitByDateOrder = await CashOrder.aggregate([
      {
        $match: { isPaid: true },
      },
      {
        $unwind: "$items",
      },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
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
            $sum: { $multiply: ["$items.price", "$items.quantity"] },
          },
          totalPurchasePrice: {
            $sum: {
              $multiply: ["$productDetails.purchasePrice", "$items.quantity"],
            },
          },
          totalDiscount: {
            $sum: {
              $multiply: [
                { $multiply: ["$items.price", "$items.quantity"] },
                {
                  $cond: [
                    { $eq: ["$membership", "Platinum"] },
                    0.07,
                    {
                      $cond: [
                        { $eq: ["$membership", "Gold"] },
                        0.05,
                        {
                          $cond: [{ $eq: ["$membership", "Silver"] }, 0.03, 0],
                        },
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

export const calcTotalProfitByMonthCash = asyncHandler(async (req, res) => {
  try {
    const profitByDateOrder = await CashOrder.aggregate([
      {
        $match: { isPaid: true },
      },
      {
        $unwind: "$items",
      },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
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
            $sum: { $multiply: ["$items.price", "$items.quantity"] },
          },
          totalPurchasePrice: {
            $sum: {
              $multiply: ["$productDetails.purchasePrice", "$items.quantity"],
            },
          },
          totalDiscount: {
            $sum: {
              $multiply: [
                { $multiply: ["$items.price", "$items.quantity"] },
                {
                  $cond: [
                    { $eq: ["$membership", "Platinum"] },
                    0.07,
                    {
                      $cond: [
                        { $eq: ["$membership", "Gold"] },
                        0.05,
                        {
                          $cond: [{ $eq: ["$membership", "Silver"] }, 0.03, 0],
                        },
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

export const calcTotalProfitByYearCash = asyncHandler(async (req, res) => {
  try {
    const profitByDateOrder = await CashOrder.aggregate([
      {
        $match: { isPaid: true },
      },
      {
        $unwind: "$items",
      },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
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
            $sum: { $multiply: ["$items.price", "$items.quantity"] },
          },
          totalPurchasePrice: {
            $sum: {
              $multiply: ["$productDetails.purchasePrice", "$items.quantity"],
            },
          },
          totalDiscount: {
            $sum: {
              $multiply: [
                { $multiply: ["$items.price", "$items.quantity"] },
                {
                  $cond: [
                    { $eq: ["$membership", "Platinum"] },
                    0.07,
                    {
                      $cond: [
                        { $eq: ["$membership", "Gold"] },
                        0.05,
                        {
                          $cond: [{ $eq: ["$membership", "Silver"] }, 0.03, 0],
                        },
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

export const calcTotalProfitByWeekCash = asyncHandler(async (req, res) => {
  try {
    const profitByDateOrder = await CashOrder.aggregate([
      {
        $match: { isPaid: true },
      },
      {
        $unwind: "$items",
      },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
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
            $sum: { $multiply: ["$items.price", "$items.quantity"] },
          },
          totalPurchasePrice: {
            $sum: {
              $multiply: ["$productDetails.purchasePrice", "$items.quantity"],
            },
          },
          totalDiscount: {
            $sum: {
              $multiply: [
                { $multiply: ["$items.price", "$items.quantity"] },
                {
                  $cond: [
                    { $eq: ["$membership", "Platinum"] },
                    0.07,
                    {
                      $cond: [
                        { $eq: ["$membership", "Gold"] },
                        0.05,
                        {
                          $cond: [{ $eq: ["$membership", "Silver"] }, 0.03, 0],
                        },
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
          _id: {
            $concat: ["$_id.month", "-", { $toString: "$_id.week" }],
          },
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

export const markOrderAsReturned = asyncHandler(async (req, res) => {
  const { returnedItems } = req.body;
  const order = await CashOrder.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (!order.isPaid) {
    res.status(400);
    throw new Error("Order has not been paid yet");
  }

  const discountPercentage =
    order.membership === "Platinum"
      ? 0.07
      : order.membership === "Gold"
      ? 0.05
      : order.membership === "Silver"
      ? 0.03
      : 0;

  let totalRefund = 0;

  for (const returnedItem of returnedItems) {
    const { product, quantity } = returnedItem;

    const itemIndex = order.items.findIndex(
      (item) => item.product.toString() === product
    );
    if (itemIndex === -1) {
      res.status(404);
      throw new Error(`Product ${product} not found in order`);
    }

    const item = order.items[itemIndex];

    if (quantity > item.quantity) {
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

    productData.countInStock += quantity;
    productData.sold -= quantity;
    await productData.save();

    const pricePerItem = item.price || 0;
    const discountPerItem = pricePerItem * discountPercentage;
    const discountedPricePerItem = pricePerItem - discountPerItem;

    const refundAmountPerItem = Math.round(discountedPricePerItem * quantity);

    totalRefund += refundAmountPerItem;

    order.returnedItems.push({
      product: item.product,
      name: item.name,
      price: discountedPricePerItem,
      quantity,
      returnedAt: new Date(),
    });

    item.quantity -= quantity;
    if (item.quantity === 0) {
      order.items.splice(itemIndex, 1);
    }
  }

  const remainingItemsPrice = order.items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const newDiscountAmount = Math.round(
    remainingItemsPrice * discountPercentage
  );

  order.totalAmount = Math.max(remainingItemsPrice - newDiscountAmount, 0);
  order.discount = newDiscountAmount;

  order.returnAmount = Math.max((order.returnAmount || 0) + totalRefund, 0);

  if (order.items.length === 0) {
    order.isReturned = true;
    order.isPaid = false;
    order.receivedAmount = 0;
    order.change = 0;
    order.totalAmount = 0;
  }

  const updatedOrder = await order.save();
  res.json(updatedOrder);
});
