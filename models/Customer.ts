import mongoose, { Schema } from "mongoose";

const CustomerSchema = new Schema(
  {
    fullname: {
      type: String,
      required: [true, "Fullname is required!"],
      trim: true,
    },
    email: {
      type: String,
      match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please fill a valid email address'],
      required: [true, "Email is required!"],
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[0-9]{10,15}$/, "Invalid phone number"],
    },
    password: {
      type: String,
      required: [true, "Password is required!"],
      minLength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

CustomerSchema.index({ email: 1 }, { unique: true });

export const Customer =
  mongoose.models.Customer || mongoose.model("Customer", CustomerSchema);
