import mongoose, { models, Schema } from "mongoose";

const ShippingAddressSchema = new Schema(
  {
    line1:     { type: String, default: "" },
    line2:     { type: String, default: "" },
    city:      { type: String, default: "" },
    province:  { type: String, default: "" },
    zipCode:   { type: String, default: "" },
    country:   { type: String, default: "Philippines" },
    landmark:  { type: String, default: "" },
    coordinates: {
      lat: Number,
      lng: Number,
    },
  },
  { _id: false },
);

const UserSchema = new Schema(
  {
    // Default shipping address saved on profile
    shippingAddress: {
      type: ShippingAddressSchema,
      required: false,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const User = models.User || mongoose.model("User", UserSchema, "user");
