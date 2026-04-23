import mongoose, { models, Schema } from "mongoose";

const UserSchema = new Schema(
  {
    _id: {
      type: String,
      required: [true, "User ID is required"],
      trim: true,
    },

    name: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },

    firstName: {
      type: String,
      required: false,
      trim: true,
      default: "",
    },

    lastName: {
      type: String,
      required: false,
      trim: true,
      default: "",
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
    },

    emailVerified: {
      type: Boolean,
      required: true,
      default: false,
    },

    image: {
      type: String,
      required: false,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
    versionKey: false
  },
);

export const User = models.User || mongoose.model("User", UserSchema);