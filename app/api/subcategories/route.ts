import { connectDB } from "@/lib/mongodb";
import { SubCategory } from "@/models/SubCategory";
import { NextRequest, NextResponse } from "next/server";
import "@/models/Category";

// ─── GET — all subcategories (optionally filtered by ?category=<id>) ──────────

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("category");

    const filter = categoryId ? { category: categoryId } : {};

    const subcategories = await SubCategory.find(filter)
      .sort({ position: 1 })
      .lean();

    return NextResponse.json(subcategories);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch subcategories" },
      { status: 500 }
    );
  }
}

// ─── POST — create subcategory ────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    await connectDB();

    const { name, category } = await request.json();

    const trimmedName = name?.trim().replace(/\s+/g, " ");

    if (!trimmedName) {
      return NextResponse.json(
        { error: "Subcategory name is required" },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { error: "Category is required" },
        { status: 400 }
      );
    }

    // Auto-increment position within the same parent category
    const last = await SubCategory.findOne({ category }).sort({ position: -1 });
    const position = last ? last.position + 1 : 1;

    const subcategory = await SubCategory.create({
      name: trimmedName,
      category,
      position,
    });

    return NextResponse.json(subcategory, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Subcategory name already exists in this category" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create subcategory" },
      { status: 500 }
    );
  }
}