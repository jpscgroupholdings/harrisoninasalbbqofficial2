import mongoose, { models, Schema } from "mongoose";

const ReservationSchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
  },
  { _id: false },
);

const InventorySchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    reservations: {
      type: [ReservationSchema],
      default: [],
    },

    reorderLevel: {
      type: Number,
      default: 10,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "Staff",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },

    // then we can just do
    // inventory.available  // automatically computed
    // instead of inventory.quantity - inventory.reserved  // repeated everywhere
  },
);

// compute from reservations array - always accurate
InventorySchema.virtual("reserved").get(function () {
  return this.reservations.reduce(
    (sum: number, r: { quantity: number }) => sum + r.quantity,
    0,
  );
});

InventorySchema.virtual("available").get(function () {
  return (
    this.quantity -
    this.reservations.reduce(
      (sum: number, r: { quantity: number }) => sum + r.quantity,
      0,
    )
  );
});

InventorySchema.index({ productId: 1, branchId: 1 }, { unique: true });

export const Inventory =
  models.Inventory || mongoose.model("Inventory", InventorySchema);
