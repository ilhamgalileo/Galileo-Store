import asyncHandler from "../middlewares/asyncHandler.js";
import CashOrder from "../models/cashOrder.js";
import Product from "../models/product.js";

export const createCashOrder = async (req, res) => {
  const {
    customerName,
    phone,
    cust_address,
    orderItems,
    receivedAmount,
  } = req.body;

  if (
    !receivedAmount
  ) {
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

    const totalAmountBeforeTax = calculatedTotal;

    const taxPrice = 0.11 * totalAmountBeforeTax;

    const discount =
      totalAmountBeforeTax < 5000000 ? 0 : totalAmountBeforeTax * 0.10;

    const totalAmount = totalAmountBeforeTax + taxPrice - discount;

    if (receivedAmount < totalAmount) {
      return res.status(400).json({
        message:
          "Received amount must be greater than or equal to total amount",
      });
    }

    const cashOrder = await CashOrder.create({
      customerName,
      phone,
      address: cust_address,
      items: validatedItems,
      taxPrice,
      totalAmount,
      receivedAmount,
      discount,
      change: receivedAmount - totalAmount,
      isPaid: true,
      paidAt: new Date(),
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
      taxPrice,
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

export const getCashOrderById = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const data = await CashOrder.findById(id).populate(
    "items.product",
    "name price images"
  );

  if (data) {
    res.send(data);
  } else {
    res.status(500).send({ message: "Order not found with id " + id });
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

    const refundAmount = (item.price || 0) * quantity;
    totalRefund += refundAmount;

    order.returnedItems.push({
      product: item.product,
      name: item.name,
      price: item.price,
      quantity,
      returnedAt: new Date(),
    });

    item.quantity -= quantity;
    if (item.quantity === 0) {
      order.items.splice(itemIndex, 1);
    }
  }

  order.totalAmount = Math.max((order.totalAmount || 0) - totalRefund, 0);
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
