// ─── Schema ───────────────────────────────────────────────────────────────────

import z from "zod";

export const CustomerSchema = z.object({
  firstname: z.string().min(1, "Firstname is required"),
  lastname: z.string().min(1, "Last name is required"),

  customerPhone: z
    .string()
    .regex(/^(09|\+639)\d{9}$/, "Invalid PH mobile number").optional().or(z.literal("")),

  customerEmail: z
    .string()
    .email("Invalid emaild address"),

  notes: z.string().optional().or(z.literal("")),
});

export const ShippingSchema = z.object({
  line1: z.string().min(1, "Address is required"),
  line2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  province: z.string().min(1, "Province is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.literal("Philippines"),
  landmark: z.string().optional(),
});

export const OrderFormSchema = z.object({
  customer: CustomerSchema,
  shippingAddress: ShippingSchema,
});

export type OrderFormState = z.infer<typeof OrderFormSchema>;