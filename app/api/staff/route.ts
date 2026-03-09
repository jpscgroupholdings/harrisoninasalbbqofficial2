import { getAuthAdmin } from "@/lib/getAuth";
import { connectDB } from "@/lib/mongodb";
import { canAccess } from "@/lib/rbac";
import Staff from "@/models/Staff";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const createStaffSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z
    .string()
    .email()
    .transform((val) => val.toLowerCase().trim()),
  password: z.string().min(8),
  phone: z.string().optional().refine((val) => !val || /^(\+63|0)[0-9]{10}$/.test(val.trim()), {message: "Invalid phone number."}),
  role: z.enum(["superadmin", "admin", "cashier"]),
  branch: z.string().min(1),
});

export async function GET() {
  try {
    await connectDB();
    const data = await Staff.find({}).populate("branch", "name code").lean();

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch staffs" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {

    const currentUser = await getAuthAdmin();
    if(!currentUser){
      return NextResponse.json({error: "Unauthorized"}, {status: 401})
    }

    if(!canAccess(currentUser.role, "staff.create")){
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const body = await request.json();
    const parsed = createStaffSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid input.";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { firstName, lastName, email, password, phone, role, branch } = parsed.data;

    const existing = await Staff.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "Email already exists." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const data = await Staff.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone,
      role,
      branch,
    });

    const staff = await Staff.findById(data._id).select("-password").lean();
    return NextResponse.json(staff, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create staff account." },
      { status: 500 },
    );
  }
}