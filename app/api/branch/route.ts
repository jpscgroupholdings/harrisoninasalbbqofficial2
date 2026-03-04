import { connectDB } from "@/lib/mongodb";
import {Branch} from "@/models/Branch";
import { NextRequest, NextResponse } from "next/server";

export async function GET(){
    try{
        await connectDB();

        const data = await Branch.find({}).sort({createdAt: -1}).lean();

        return NextResponse.json(data, {status: 200})

    }catch(error){
        return NextResponse.json({
            error: "Failed to fetch"
        }, {status: 500})
    }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const {
      name,
      street,
      city,
      zipCode,
      contactNumber,
      open,
      close,
      daysOpen,
    } = body;

    const count = await Branch.countDocuments();
    const code = `BR-${String(count + 1).padStart(3, "0")}`;

    const data = await Branch.create({
      name,
      code,
      address: {
        street,
        city,
        zipCode,
      },
      contactNumber,
      operatingHours: {
        open,
        close,
        daysOpen,
      },
    });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error(error); // so you can see it in terminal
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create branch",
      },
      { status: 500 },
    );
  }
}
