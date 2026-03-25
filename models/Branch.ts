import mongoose, { models, Schema } from "mongoose";

const BranchSchema = new Schema(
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
      type: String,
      required: [true, "Branch address is required"],
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude] — GeoJSON order - flip when saving
        required: true,
      },
    },
    contactNumber: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
    },
   operatingHours: {
      open: { type: String, default: "08:00", match: [/^\d{2}:\d{2}$/, "Use HH:MM format"] },
      close: { type: String, default: "22:00", match: [/^\d{2}:\d{2}$/, "Use HH:MM format"] },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

export const Branch = models.Branch || mongoose.model("Branch", BranchSchema);
