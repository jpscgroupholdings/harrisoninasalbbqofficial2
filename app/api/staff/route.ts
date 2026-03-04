import { connectDB } from "@/lib/mongodb";
import Staff from "@/models/Staff";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

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
    await connectDB();

    const body = await request.json();
    const { firstName, lastName, email, password, phone, role, branch } = body;

    // basic validation
    if (!firstName || !lastName || !email || !password || !role || !branch) {
      return NextResponse.json(
        { error: "All required fields must be filled." },
        { status: 400 },
      );
    }

    const existing = await Staff.findOne({email});
    if(existing){
        return NextResponse.json({error: "Email is already exist!"}, {status: 409})
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const data = await Staff.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone,
      role,
      branch,
    });

    // strip password from response
    const {password: _, ...staff} = data.toObject();

    return NextResponse.json(staff, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create staff's account!" },
      { status: 500 },
    );
  }
}
