import { z } from "zod";

/**
 * Shared Zod validation schemas for modifier item and group data.
 * Used by both the Products API and the Modifier Group Templates API.
 */

/** Validates a single modifier item (or template item) in a request body */
export const modifierItemSchema = z.object({
  product: z.string().min(1, "Item must reference a product"),
  label: z.string().nullable().optional(),
  price: z.coerce.number().nullable().optional(),
  snapshotName: z.string().nullable().optional(),
  snapshotPrice: z.coerce.number().nullable().optional(),
  position: z.coerce.number().int().min(0).optional(),
});

/** Validates a modifier group (with embedded items) in a product request body */
export const modifierGroupSchema = z.object({
  _id: z.string().optional(),
  templateId: z.string().nullable().optional(),
  name: z.string().min(1, "Group name is required"),
  required: z.boolean().default(true),
  minSelect: z.coerce.number().int().min(1).default(1),
  maxSelect: z.coerce.number().int().min(1).default(1),
  position: z.coerce.number().int().min(0).optional(),
  items: z.array(modifierItemSchema).min(1, "Group must have at least one item"),
});
