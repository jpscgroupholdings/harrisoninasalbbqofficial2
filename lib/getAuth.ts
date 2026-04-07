import { STAFF_ROLES, StaffRole } from "@/types/staff";
import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "./mongodb";
import Staff from "@/models/Staff";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in env variables!");
}

export const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export const COOKIE_NAMES = {
  ADMIN_TOKEN: "admin_token",
  CUSTOMER_TOKEN: "customer_token",
};

export type CookieType = (typeof COOKIE_NAMES)[keyof typeof COOKIE_NAMES];

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (!payload) throw new Error("Unauthorized");
    return payload;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}

export async function getAuth(request: NextRequest, cookieName: CookieType) {
  const token = request.cookies.get(cookieName)?.value;

  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  return payload;
}

export async function getAdminAuth(request: NextRequest) {
  const payload = await getAuth(request, COOKIE_NAMES.ADMIN_TOKEN);
  if (!payload) return null;

  return {
    id: payload.id as string,
    role: payload.role as StaffRole,
    isActive: payload.isActive as boolean,
  };
}

export async function getCustomerAuth(request: NextRequest) {
  const payload = await getAuth(request, COOKIE_NAMES.CUSTOMER_TOKEN);
  if (!payload) return null;

  return {
    id: payload.id as string,
    isActive: payload.isActive as boolean,
  };
}

export async function requireAdmin(request: NextRequest) {
  const admin = await getAdminAuth(request);
  if (!admin) throw new Error("Unauthorized!");

  await connectDB();
  const staffRecord = await Staff.findById(admin.id).lean();
  if (!staffRecord || !staffRecord.isActive) throw new Error("Unauthorized");
  return staffRecord;
}

export async function requireSuperAdmin(request: NextRequest) {

  const superadmin = await requireAdmin(request);
  if (superadmin.role !== STAFF_ROLES.SUPERADMIN) {
    throw new Error("Access denied. Superadmin privileges required.");
  }
  return superadmin;
}
