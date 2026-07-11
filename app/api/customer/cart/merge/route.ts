/**
 * POST /api/cart/merge
 *
 * Merges a guest cart (from localStorage) into the authenticated user's DB cart.
 * Called once right after login via `mergeGuestCartOnLogin()` in CartContext.
 *
 * Merge strategy: guest items are added on top of existing DB quantities.
 * If the same item exists in both, quantities are summed.
 */

import { Cart } from "@/models/Cart";
import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { CartItem } from "@/types/MenuTypes";
import { requireBetterAuth } from "@/lib/getAuth";
import { getAPIError } from "@/lib/getApiError";

export async function POST(req: Request) {
  try {
    const customer = await requireBetterAuth(req);

    const body = await req.json();
    const guestItems: CartItem[] = Array.isArray(body?.guestItems)
      ? body.guestItems
      : [];

    if (guestItems.length === 0) {
      return NextResponse.json({ ok: true, merged: 0 });
    }

    await connectDB();

    const existing = await Cart.findOne({ customerId: customer._id });
    const dbItems: CartItem[] = existing?.items ?? [];

    // Merge: start from DB items, layer guest items on top
    const merged = [...dbItems];
    for (const guestItem of guestItems) {
      const idx = merged.findIndex(
        (i) => String(i._id) === String(guestItem._id),
      );
      if (idx !== -1) {
        // Sum quantities for items that exist in both
        merged[idx] = {
          ...merged[idx],
          activeProductDiscount:
            guestItem.activeProductDiscount ??
            merged[idx].activeProductDiscount,
          quantity: merged[idx].quantity + guestItem.quantity,
        };
      } else {
        merged.push(guestItem);
      }
    }

    await Cart.findOneAndUpdate(
      { customerId: customer._id },
      {
        items: merged,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      { upsert: true, new: true },
    );

    return NextResponse.json({ ok: true, merged: guestItems.length });
  } catch (error) {
    return getAPIError(error, 500, {
      fallbackMessage: "Failed to merge items from guest mode",
    });
  }
}
