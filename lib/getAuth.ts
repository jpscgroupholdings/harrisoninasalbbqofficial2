import { StaffRole } from "@/hooks/api/useStaff";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { verifyToken } from "./verifyToken";

export async function getAuthAdmin() {
  const token = (await cookies()).get("admin_token")?.value;

  if (!token) return null;

  try {
    const payload = await verifyToken(token);

    if (!payload) return null;

    return {
      id: payload.id as string,
      email: payload.email as string,
      role: payload.role as StaffRole,
    };
  } catch (error) {
    return null;
  }
}
