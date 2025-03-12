import mongoose from "mongoose";

const orderStoreSchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
    orderItems: [
      {
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        image: { type: String },
        images: { type: [], required: true },
        price: { type: Number, required: true },
        product: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: "Product",
        },
      },
    ],

    paymentMethod: { type: String, required: true },
    paymentResult: {
      id: { type: String },
      status: { type: String },
      update_time: { type: String },
      email_address: { type: String },
      payment_type: { type: String },
    },
    returnAmount: {
      type: Number,
      required: true,
      default: 0.0,
    },
    isReturned: {
      type: Boolean,
      required: true,
      default: false,
    },
    returnedItems: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        name: String,
        image: String,
        price: Number,
        qty: Number,
        returnedAt: { type: Date, default: Date.now },
      },
    ],

    itemsPrice: { type: Number, required: true },
    discount: { type: Number },
    taxPrice: { type: Number, required: true, default: 0.0 },
    discount: { type: Number },
    totalPrice: { type: Number, required: true, default: 0.0 },
    isPaid: { type: Boolean, required: true, default: false },
    paidAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

const OrderStore = mongoose.model("OrderStore", orderStoreSchema);
export default OrderStore;
