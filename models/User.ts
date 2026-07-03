import mongoose, { models, Schema } from "mongoose";

const ShippingAddressSchema = new Schema(
  {
    line1: { type: String, default: "" },
    line2: { type: String, default: "" },
    city: { type: String, default: "" },
    cityCode: { type: String, default: "" },
    province: { type: String, default: "" },
    region: { type: String, default: "" },
    regionCode: { type: String, default: "" },
    barangayCode: { type: String, default: "" },
    subMunicipality: { type: String, default: "" },
    subMunicipalityCode: { type: String, default: "" },
    zipCode: { type: String, default: "" },
    country: { type: String, default: "Philippines" },
    landmark: { type: String, default: "" },
    placeName: { type: String, default: "" },
    coordinates: {
      lat: Number,
      lng: Number,
    },
  },
  { _id: false },
);

const UserSchema = new Schema(
  {
    // ISO timestamp of when the user accepted Terms of Use & Privacy Policy
    termsAcceptedAt: { type: String, required: false, default: null },

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
