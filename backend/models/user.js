import mongoose from "mongoose";
import bcrypt from "bcrypt";
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "username is required"],
      trim: true,
      minlength: [3, "name must have at least 3 character"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (value) {
          return /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value);
        },
        message: (props) => `${props.value} format email invalid`,
      },
    },
    password: {
      type: String,
      required: [true],
      minlength: [6],
      select: false,
    },
    isAdmin: {
      type: Boolean,
      default: null,
    },

    superAdmin: {
      type: Boolean,
      default: null,
    },

    membership: {
      type: String,
      enum: ["None", "Silver", "Gold", "Platinum"],
      default: "None",
    },
    point: { type: Number, default: 0 },

    phone: { type: Number, trim: true, },

    shippingAddress: [
      {
        recipient: String,
        province: String,
        city: String,
        district: String,
        village: String,
        postalCode: String,
        detail_address: String,
      },
    ],
  },
  { timestamps: true }
);

userSchema.methods.updateMembership = function () {
  if (this.point >= 10000) {
    this.membership = "Platinum";
  } else if (this.point >= 5000) {
    this.membership = "Gold";
  } else if (this.point >= 1000) {
    this.membership = "Silver";
  } else {
    this.membership = "None";
  }
};

userSchema.methods.getDiscount = function () {
  if (this.membership === "Platinum") return 0.07;
  if (this.membership === "Gold") return 0.05;
  if (this.membership === "Silver") return 0.03;
  return 0;
};

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model("User", userSchema);
export default User;
