
import { connectDB } from "@/lib/mongodb";
import { Settings } from "@/models/Setting";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB

    // Settings is a singleton — always fetch the first (and only) document
    const settings = await Settings.findOne().select("+contact.phone +contact.viber");

    if (!settings) {
      return NextResponse.json({ data: null }, { status: 200 });
    }

    return NextResponse.json({ data: settings }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/settings]", error);
    return NextResponse.json(
      { message: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();

    // Upsert: update existing settings or create if none exist
    const settings = await Settings.findOneAndUpdate(
      {}, // match the first document (singleton)
      { $set: body },
      { new: true, upsert: true, runValidators: true }
    );

    return NextResponse.json(
      { message: "Settings saved successfully", data: settings },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[POST /api/settings]", error);

    // Mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(
        (e: any) => e.message
      );
      return NextResponse.json(
        { message: messages.join(", ") },
        { status: 422 }
      );
    }

    // Duplicate key (unique email)
    if (error.code === 11000) {
      return NextResponse.json(
        { message: "Email address is already in use" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: "Failed to save settings" },
      { status: 500 }
    );
  }
}