/**
 * Centralized validation schemas and helpers for the ordering system.
 *
 * Shared rules (password policy, name checks) live here once;
 * domain-specific differences (customer vs. admin email, PH phone formats)
 * are kept as separate schemas in the same file so they're easy to find
 * and compare, without scattering validation logic across routes and components.
 */

import { ADMIN_EMAIL_DOMAINS, GMAIL_DOMAIN } from "@/lib/isAllowedEmails";
import { STAFF_ROLES } from "@/types/staff";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Password — one policy, used by staff, customer, and admin change-password
// ---------------------------------------------------------------------------

/** Check whether a password meets the project's complexity requirements. */
export function isPasswordSecure(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

/** Reusable Zod schema enforcing the password policy (min 8 + uppercase + number + symbol). */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .refine((val) => /[A-Z]/.test(val), {
    message: "Password must contain at least one uppercase letter",
  })
  .refine((val) => /[0-9]/.test(val), {
    message: "Password must contain at least one number",
  })
  .refine((val) => /[^A-Za-z0-9]/.test(val), {
    message: "Password must contain at least one symbol",
  });

// ---------------------------------------------------------------------------
// Name — shared between staff and customer forms
// ---------------------------------------------------------------------------

/** Zod schema for a required, trimmed first/last name. */
export const nameSchema = z.string().min(1).trim();

// ---------------------------------------------------------------------------
// Email — same format validation, different domain restrictions
// ---------------------------------------------------------------------------

/** Base email schema: valid format + normalize to lowercase trim. */
const emailBase = z
  .string()
  .email()
  .transform((val) => val.toLowerCase().trim());

/** Customer email: only @gmail.com addresses. */
export const customerEmailSchema = emailBase.refine(
  (val) => val.split("@")[1] === GMAIL_DOMAIN,
  {
    message: `Only @${GMAIL_DOMAIN} email addresses are accepted`,
  },
);

/** Admin email: only approved company domains. */
export const adminEmailSchema = emailBase.refine(
  (val) => ADMIN_EMAIL_DOMAINS.includes(val.split("@")[1]),
  {
    message: `Only @${ADMIN_EMAIL_DOMAINS.join(" or @")} email addresses are accepted`,
  },
);

// ---------------------------------------------------------------------------
// Phone — different formats for staff vs. customer
// ---------------------------------------------------------------------------

/** Staff phone: PH format (+63 or 0 prefix, 10 digits after). Optional, empty → undefined. */
export const staffPhoneSchema = z.preprocess(
  (val) => (val === "" ? undefined : val),
  z
    .string()
    .refine((val) => /^(\+63|0)[0-9]{10}$/.test(val.trim()), {
      message: "Invalid phone number.",
    })
    .optional(),
);

/** Customer phone: PH mobile format (09 or +639 prefix, 9 digits after). */
export const customerPhoneSchema = z
  .string()
  .regex(/^(09|\+639)\d{9}$/, "Invalid phone number. Use 09XXXXXXXXX or +639XXXXXXXXX.");

// ---------------------------------------------------------------------------
// Change-password — shared between admin and customer change-password routes
// ---------------------------------------------------------------------------

/** Schema for self-password-change (new password only, session proves identity). */
export const changePasswordSchema = z.object({
  newPassword: passwordSchema,
});

// ---------------------------------------------------------------------------
// Staff creation — full schema combining the shared pieces above
// ---------------------------------------------------------------------------

/** Schema for creating a new staff account. */
export const createStaffSchema = z
  .object({
    firstName: nameSchema,
    lastName: nameSchema,
    email: adminEmailSchema,
    password: passwordSchema,
    phone: staffPhoneSchema,
    role: z.enum(["superadmin", "admin", "cashier"]),
    branch: z.preprocess(
      (val) => (val === "" ? undefined : val),
      z.string().min(1).optional(),
    ),
  })
  .superRefine((data, ctx) => {
    if (data.role === STAFF_ROLES.ADMIN && !data.branch) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["branch"],
        message: "Branch is required for admin role.",
      });
    }
  });

// ---------------------------------------------------------------------------
// Staff update — password is optional; branch allows null for cross-branch roles
// ---------------------------------------------------------------------------

/** Schema for updating an existing staff account. */
export const updateStaffSchema = z
  .object({
    firstName: nameSchema,
    lastName: nameSchema,
    email: adminEmailSchema,
    password: z.preprocess(
      (val) => (val === "" ? undefined : val),
      passwordSchema.optional(),
    ),
    phone: staffPhoneSchema,
    role: z.enum(["superadmin", "admin", "cashier"]),
    branch: z.preprocess(
      (val) => (val === "" ? null : val === undefined ? undefined : val),
      z.string().min(1).nullable().optional(),
    ),
  })
  .superRefine((data, ctx) => {
    if (data.role === STAFF_ROLES.ADMIN && !data.branch) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["branch"],
        message: "Branch is required for admin role.",
      });
    }
  });
