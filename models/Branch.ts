import mongoose from "mongoose";

const branchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Branch name is required"],
      trim: true,
    },
    code: {
      type: String,
      required: [true, "Branch code is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String },
      zipCode: { type: String },
      country: { type: String, default: "Philippines" },
    },
    contactNumber: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    operatingHours: {
      open: { type: String, default: "08:00" },   // e.g. "08:00"
      close: { type: String, default: "22:00" },  // e.g. "22:00"
      daysOpen: {
        type: [String],
        enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        default: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

const Branch = mongoose.model("Branch", branchSchema);

export default Branch;