import { StaffRole } from "@/hooks/api/useStaff";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { email } from "zod";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in env variable!");
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function getAuthAdmin() {
  const token = (await cookies()).get("admin_token")?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    return {
      id: payload.id as string,
      email: payload.emaild as string,
      role: payload.role as StaffRole,
    };
  } catch (error) {
    return null;
  }
}
