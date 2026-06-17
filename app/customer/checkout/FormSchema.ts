// ─── Schema ───────────────────────────────────────────────────────────────────

import z from "zod";

export const CustomerSchema = z.object({
  firstName: z.string().min(1, "Firstname is required"),
  lastName: z.string().min(1, "Last name is required"),

  customerPhone: z
    .string()
    .regex(/^(09|\+639)\d{9}$/, "Invalid PH mobile number"),

  customerEmail: z
    .string()
    .email("Invalid emaild address"),

  notes: z.string().optional().or(z.literal("")),
});

const CoordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const ShippingSchema = z.object({
  line1: z.string().min(1, "Please provide your house no."),
  line2: z.string().min(1, "Please provide brgy/village"),
  city: z.string().min(1, "City is required"),
  province: z.string().min(1, "Province is required"),
  zipCode: z.string().min(1, "Postal code is required"),
  country: z.literal("Philippines"),
  landmark: z.string().optional(),
  coordinates: CoordinatesSchema.optional(),
}).superRefine((value, ctx) => {
  if (!value.coordinates) {
    ctx.addIssue({
      code: "custom",
      path: ["coordinates"],
      message: "Pin your delivery location on the map",
    });
  }
});

export const OrderFormSchema = z.object({
  customer: CustomerSchema,
  shippingAddress: ShippingSchema,
});

export type OrderFormState = z.infer<typeof OrderFormSchema>;
