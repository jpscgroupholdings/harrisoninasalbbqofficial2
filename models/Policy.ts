import mongoose, { models, Schema, Types } from "mongoose";

/**
 * POLICY SCHEMA
 *
 * Stores legal policy documents (Privacy Policy, Terms of Use,
 * Refund Policy, Delivery Policy) as structured data so admins
 * can update content dynamically without redeploying.
 *
 * Each document is identified by a unique slug and contains
 * an ordered array of sections with Markdown content.
 */

const PolicySectionSchema = new Schema(
  {
    heading: {
      type: String,
      required: [true, "Section heading is required"],
      trim: true,
    },
    /** Markdown-formatted content for this section */
    content: {
      type: String,
      required: [true, "Section content is required"],
    },
  },
  { _id: true },
);

const LastUpdatedBySchema = new Schema(
  {
    staffId: {
      type: Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false },
);

const PolicySchema = new Schema(
  {
    slug: {
      type: String,
      required: [true, "Policy slug is required"],
      unique: true,
      trim: true,
      enum: [
        "privacy-policy",
        "terms-of-use",
        "refund-policy",
        "delivery-policy",
      ],
    },
    title: {
      type: String,
      required: [true, "Policy title is required"],
      trim: true,
    },
    /** Introductory paragraph displayed below the title */
    subtitle: {
      type: String,
      required: [true, "Policy subtitle is required"],
      trim: true,
    },
    sections: {
      type: [PolicySectionSchema],
      default: [],
      validate: [
        (v: unknown[]) => Array.isArray(v) && v.length > 0,
        "Policy must have at least one section",
      ],
    },
    lastUpdatedBy: {
      type: LastUpdatedBySchema,
      default: null,
    },
  },
  { timestamps: true },
);

export const Policy =
  models.Policy || mongoose.model("Policy", PolicySchema);
