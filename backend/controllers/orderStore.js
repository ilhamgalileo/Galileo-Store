import asyncHandler from "express-async-handler";
import Product from "../models/product.js";
import snap from "../config/midtrans.js";
import OrderStore from "../models/orderStore.js";

function calcPrice(orderItems) {
  const totalPrice = orderItems.reduce(
    (acc, item) => acc + item.price * item.qty,
    0
  );
  return {
    totalPrice: Math.round(totalPrice),
  };
}

export const createInStoreOrder = asyncHandler(async (req, res) => {
  const { orderItems, paymentMethod } = req.body;

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

  const {  totalPrice } = calcPrice(dbOrderItems);

  const order = new OrderStore({
    orderItems: dbOrderItems,
    user: req.user._id,
    paymentMethod,
    totalPrice,
  });

  const createdOrder = await order.save();
  const orderId = createdOrder.id;

  const orderDetails = {
    transaction_details: {
      order_id: orderId,
      gross_amount: totalPrice,
    },
    customer_details: {
      first_name: req.user.username,
      email: req.user.email,
    },
    item_details: [
      ...dbOrderItems.map((item) => ({
        id: item.product,
        price: item.price,
        quantity: item.qty,
        name: item.name,
      })),
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

export const markOrderIsPay = asyncHandler(async (req, res) => {
  const order = await OrderStore.findById.populate("user", "username");

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
          product.sold -= item.qty;

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
