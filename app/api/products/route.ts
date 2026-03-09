import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { NextResponse, NextRequest } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { z } from "zod";
import "@/models/Category";

// ZOD Schema

const productCreateSchema = z
  .object({
    name: z
      .string()
      .min(3, "Name is required")
      .max(30, "Name must be less than 30 characters"),
    description: z
      .string()
      .min(10, "Description is required")
      .max(300, "Description must be less than 300 characters"),
    price: z.coerce.number().positive("Price must be a positive number"),
    category: z.string().min(1, "Category is required"),
    stock: z.coerce
      .number()
      .int()
      .nonnegative("Stock must be a non-negative integer"),
    image: z.string().optional(),
    imageFile: z.string().optional(),
    isSignature: z.boolean().optional(),
  })
  .refine((data) => data.image || data.imageFile, {
    message: "Image is required",
    path: ["image"],
  });

// GET all products
export async function GET() {
  try {
    await connectDB();

    const products = await Product.aggregate([
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      { $sort: { "category.position": 1, createdAt: -1 } },
    ]);

    return NextResponse.json(products, { status: 200 });
  } catch (error: any) {
    console.error("FULL ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create new product
export async function POST(request: NextRequest) {
  let uploadResult: any;

  try {
    await connectDB();

    const body = await request.json();

    // runtime validation using ZOD
    const validateData = productCreateSchema.parse(body);

    const {
      name,
      description,
      price,
      category,
      stock,
      imageFile,
      isSignature,
    } = validateData;

    const normalizedCategory = category
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-");

    // Upload Image
    let finalImage = {
      url: "",
      public_id: "",
    };

    if (imageFile) {
      uploadResult = await cloudinary.uploader.upload(imageFile, {
        folder: "products",
        transformation: [
          { width: 1200, height: 1200, crop: "limit" },
          { quality: "auto" },
        ],
      });

      finalImage = {
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
      };
    }

    // ✅ STEP 4: Create product
    const product = await Product.create({
      name,
      price,
      description,
      image: finalImage,
      category: normalizedCategory,
      stock,
      isSignature,
    });

    if (!product) {
      await cloudinary.uploader.destroy(finalImage.public_id);
    }

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error("Error creating product:", error);

    if (uploadResult?.public_id) {
      await cloudinary.uploader.destroy(uploadResult.public_id);
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error?.issues,
        },
        { status: 400 },
      );
    }

    // Duplicate name handling
    if (error?.code === 11000) {
      return NextResponse.json(
        { success: false, error: "Product already exists" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to create product!" },
      { status: 500 },
    );
  }
}
