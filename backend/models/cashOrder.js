import mongoose from "mongoose";

const cashOrderSchema = mongoose.Schema(
  {
    customerName: { type: String, default: null },
    phone: { type: String, default: null },
    address: { type: String, default: null },
    membership: {
      type: String,
      enum: ["None", "Silver", "Gold", "Platinum"],
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],
    totalAmount: { type: Number, required: true },
    taxPrice: { type: Number, required: true, default: 0 },
    receivedAmount: { type: Number, required: true },
    change: { type: Number, required: true, default: 0 },
    isPaid: { type: Boolean, default: false },
    paidAt: {type: Date},
    paymentMethod: { type: String, default: "cash", required: true },
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
        quantity: Number,
        returnedAt: { type: Date, default: Date.now },
      },
    ],
    returnAmount: {
      required: true,
      default: 0,
      type: Number,
    },
    isReturned: {
      type: Boolean,
    },
    discount: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

const CashOrder = mongoose.model("CashOrder", cashOrderSchema);
export default CashOrder;
