import { connectDB } from "@/lib/mongodb";
import { calculateDeliveryFeeFromCoordinates } from "@/lib/deliveryFee";
import { Branch } from "@/models/Branch";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

type DeliveryFeeEstimateBody = {
  branchId?: string;
  coordinates?: {
    lat?: number;
    lng?: number;
  };
};

const isValidCoordinate = (lat?: number, lng?: number) =>
  typeof lat === "number" &&
  Number.isFinite(lat) &&
  lat >= -90 &&
  lat <= 90 &&
  typeof lng === "number" &&
  Number.isFinite(lng) &&
  lng >= -180 &&
  lng <= 180;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as DeliveryFeeEstimateBody;
    const { branchId, coordinates } = body;
    const deliveryCoordinates = {
      lat: Number(coordinates?.lat),
      lng: Number(coordinates?.lng),
    };

    if (!branchId || !mongoose.Types.ObjectId.isValid(branchId)) {
      return NextResponse.json(
        { error: "Valid branchId is required." },
        { status: 400 },
      );
    }

    if (!isValidCoordinate(deliveryCoordinates.lat, deliveryCoordinates.lng)) {
      return NextResponse.json(
        { error: "Valid delivery coordinates are required." },
        { status: 400 },
      );
    }

    await connectDB();

    const branch = await Branch.findById(branchId).select("location").lean<{
      location?: {
        coordinates?: [number, number];
      };
    }>();

    if (!branch?.location?.coordinates) {
      return NextResponse.json(
        { error: "Branch coordinates are not available." },
        { status: 404 },
      );
    }

    // The client sends only the delivery pin; branch coordinates come from DB.
    const estimate = calculateDeliveryFeeFromCoordinates(
      branch.location.coordinates,
      deliveryCoordinates,
    );

    return NextResponse.json({ data: estimate });
  } catch {
    return NextResponse.json(
      { error: "Failed to estimate delivery fee." },
      { status: 500 },
    );
  }
}
