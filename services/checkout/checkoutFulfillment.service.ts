import { FULFILLMENT_TYPE, FulfillmentType } from "@/types/orderConstants";
import {
  CITY_RESTRICTION_MESSAGE,
  isCityAllowedForDelivery,
  isWithinMetroManilaDeliveryArea,
  OUTSIDE_DELIVERY_AREA_MESSAGE,
} from "../../lib/deliveryArea";
import { calculateDeliveryFeeFromCoordinates } from "../../lib/deliveryFee";
import type { CreateOrderPayload } from "../../types/OrderTypes";
import { isBranchCoordinates } from "../branch/branch.service";
import { Settings } from "@/models/Setting";
import type { ClientSession } from "mongoose";
import { getDayLabel, toMinutes } from "@/lib/operatingHours";
import { toPHDate } from "@/utils/toPHDate";

type FulfillmentPayload = {
  fulfillmentType?: FulfillmentType;
  shippingAddress?: CreateOrderPayload["shippingAddress"];
  reservation?: CreateOrderPayload["reservation"];
  pickupTime?: string;
};

type BranchWithCoordinates = {
  location?: {
    coordinates?: unknown;
  };
};


export function normalizeFulfillmentType(
  fulfillmentType?: FulfillmentType,
): FulfillmentType {
  if (
    fulfillmentType &&
    fulfillmentType !== FULFILLMENT_TYPE.DELIVERY &&
    fulfillmentType !== FULFILLMENT_TYPE.PICKUP &&
    fulfillmentType !== FULFILLMENT_TYPE.DINE_IN
  ) {
    throw new Error("Invalid fulfillment type.");
  }

  if (fulfillmentType === FULFILLMENT_TYPE.PICKUP) return "pickup";
  if (fulfillmentType === FULFILLMENT_TYPE.DINE_IN) return "dine_in";
  return "delivery";
}

/**
 * Validates that reservation fields are present, valid, and aligned
 * with the store's operating hours (day must be open, time must be
 * within hours with a 1-hour buffer before closing).
 */
async function validateReservationPayload(
  reservation: CreateOrderPayload["reservation"],
  session: ClientSession,
): Promise<void> {
  if (!reservation) {
    throw new Error("Reservation details are required for dine-in orders.");
  }

  if (!reservation.scheduledAt) {
    throw new Error("Reservation date and time is required.");
  }

  const scheduledDate = new Date(reservation.scheduledAt);
  if (isNaN(scheduledDate.getTime())) {
    throw new Error("Invalid reservation date.");
  }

  if (scheduledDate <= new Date()) {
    throw new Error("Reservation must be scheduled for a future date and time.");
  }

  if (!reservation.partySize || reservation.partySize < 1) {
    throw new Error("At least 1 guest is required.");
  }

  if (reservation.partySize > 50) {
    throw new Error("Maximum 50 guests per reservation.");
  }

  // Validate against operating hours
  const settings = await Settings.findOne().session(session);
  const operatingHours = settings?.operatingHours;

  if (!operatingHours) {
    throw new Error("Store operating hours are not configured.");
  }

  if (operatingHours.isClosed) {
    throw new Error("Store is currently closed and not accepting reservations.");
  }

  if (!operatingHours.openTime || !operatingHours.closeTime) {
    throw new Error("Store operating hours are not properly configured.");
  }

  // Convert to PH-local time so hours/day are correct regardless of server timezone (Vercel runs in UTC)
  const phScheduled = toPHDate(scheduledDate);

  const reservationMinutes = phScheduled.getHours() * 60 + phScheduled.getMinutes();
  const openMinutes = toMinutes(operatingHours.openTime);
  const closeMinutes = toMinutes(operatingHours.closeTime);
  const crossesMidnight = closeMinutes <= openMinutes;

  if (crossesMidnight) {
    // Overnight schedule (e.g. 10:00 AM – 2:00 AM):
    // Valid if time >= open OR time < close (after-midnight spillover).
    const todayLabel = getDayLabel(phScheduled);
    const yesterdayIndex = ((phScheduled.getDay() + 6) % 7 + 6) % 7;
    const DAYS: ("Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun")[] = [
      "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun",
    ];
    const yesterdayLabel = DAYS[yesterdayIndex];

    const isAfterOpenToday =
      reservationMinutes >= openMinutes && operatingHours.days.includes(todayLabel);
    const isBeforeCloseFromYesterday =
      reservationMinutes < closeMinutes && operatingHours.days.includes(yesterdayLabel);

    if (!isAfterOpenToday && !isBeforeCloseFromYesterday) {
      throw new Error(
        `Reservation time must be within operating hours (${operatingHours.openTime} – ${operatingHours.closeTime}).`,
      );
    }

    // 1-hour buffer before close only applies in the after-midnight spillover window
    if (isBeforeCloseFromYesterday && reservationMinutes > closeMinutes - 60) {
      throw new Error(
        `Last reservation must be at least 1 hour before closing (${operatingHours.closeTime}).`,
      );
    }
  } else {
    // Same-day schedule (e.g. 10:00 AM – 10:00 PM)
    const dayLabel = getDayLabel(phScheduled);
    if (!operatingHours.days.includes(dayLabel)) {
      throw new Error(`Store is closed on ${dayLabel}. Please select an operating day.`);
    }

    if (reservationMinutes < openMinutes) {
      throw new Error(`Reservation time must be at or after ${operatingHours.openTime}.`);
    }

    const lastReservationMinutes = closeMinutes - 60; // 1hr before closing
    if (reservationMinutes > lastReservationMinutes) {
      throw new Error(
        `Last reservation must be at least 1 hour before closing (${operatingHours.closeTime}).`,
      );
    }
  }
}

/**
 * Validates that the declared pickup time is present, valid, a future date,
 * and falls within the store's operating hours.
 */
async function validatePickupTimePayload(
  pickupTime: string | undefined,
  session: ClientSession,
): Promise<void> {
  if (!pickupTime) {
    throw new Error("Pickup date and time is required.");
  }

  const pickupDate = new Date(pickupTime);
  if (isNaN(pickupDate.getTime())) {
    throw new Error("Invalid pickup date.");
  }

  if (pickupDate <= new Date()) {
    throw new Error("Pickup time must be in the future.");
  }

  // Validate against operating hours
  const settings = await Settings.findOne().session(session);
  const operatingHours = settings?.operatingHours;

  if (!operatingHours) {
    throw new Error("Store operating hours are not configured.");
  }

  if (operatingHours.isClosed) {
    throw new Error("Store is currently closed and not accepting pickup orders.");
  }

  if (!operatingHours.openTime || !operatingHours.closeTime) {
    throw new Error("Store operating hours are not properly configured.");
  }

  // Convert to PH-local time so hours/day are correct regardless of server timezone (Vercel runs in UTC)
  const phPickup = toPHDate(pickupDate);

  const pickupMinutes = phPickup.getHours() * 60 + phPickup.getMinutes();
  const openMinutes = toMinutes(operatingHours.openTime);
  const closeMinutes = toMinutes(operatingHours.closeTime);
  const crossesMidnight = closeMinutes <= openMinutes;

  if (crossesMidnight) {
    // Overnight schedule (e.g. 10:00 AM – 2:00 AM):
    // Valid if time >= open OR time < close (after-midnight spillover).
    // The day label should match either today (post-open) or yesterday (pre-close).
    const todayLabel = getDayLabel(phPickup);
    const yesterdayIndex = ((phPickup.getDay() + 6) % 7 + 6) % 7;
    const DAYS: ("Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun")[] = [
      "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun",
    ];
    const yesterdayLabel = DAYS[yesterdayIndex];

    const isAfterOpenToday =
      pickupMinutes >= openMinutes && operatingHours.days.includes(todayLabel);
    const isBeforeCloseFromYesterday =
      pickupMinutes < closeMinutes && operatingHours.days.includes(yesterdayLabel);

    if (!isAfterOpenToday && !isBeforeCloseFromYesterday) {
      throw new Error(
        `Pickup time must be within operating hours (${operatingHours.openTime} – ${operatingHours.closeTime}).`,
      );
    }
  } else {
    // Same-day schedule (e.g. 10:00 AM – 10:00 PM)
    const dayLabel = getDayLabel(phPickup);
    if (!operatingHours.days.includes(dayLabel)) {
      throw new Error(`Store is closed on ${dayLabel}. Please select an operating day.`);
    }

    if (pickupMinutes < openMinutes) {
      throw new Error(`Pickup time must be at or after ${operatingHours.openTime}.`);
    }

    if (pickupMinutes > closeMinutes) {
      throw new Error(`Pickup time must be at or before ${operatingHours.closeTime}.`);
    }
  }
}

// Validates fulfillment-specific checkout requirements before pricing/persisting.
export async function validateFulfillmentPayload({
  fulfillmentType,
  shippingAddress,
  reservation,
  pickupTime,
}: FulfillmentPayload, session?: ClientSession): Promise<void> {
  const normalizedFulfillmentType = normalizeFulfillmentType(fulfillmentType);

  if (normalizedFulfillmentType === FULFILLMENT_TYPE.PICKUP) {
    if (!session) {
      throw new Error("Session is required for pickup time validation.");
    }
    await validatePickupTimePayload(pickupTime, session);
    return;
  }

  if (normalizedFulfillmentType === FULFILLMENT_TYPE.DINE_IN) {
    if (!session) {
      throw new Error("Session is required for dine-in reservation validation.");
    }
    await validateReservationPayload(reservation, session);
    return;
  }

  const coordinates = shippingAddress?.coordinates;

  if (!shippingAddress) throw new Error("Shipping address is required.");
  if (!shippingAddress.line1 || !shippingAddress.line2) {
    throw new Error("Complete shipping address is required.");
  }
  if (!shippingAddress.city || !shippingAddress.province) {
    throw new Error("City and province are required.");
  }
  if (!shippingAddress.zipCode) throw new Error("Postal code is required.");
  if (!coordinates) throw new Error("Pin your delivery location on the map.");
  if (!isWithinMetroManilaDeliveryArea(coordinates)) {
    throw new Error(OUTSIDE_DELIVERY_AREA_MESSAGE);
  }

  if (!isCityAllowedForDelivery(shippingAddress)) {
    throw new Error(CITY_RESTRICTION_MESSAGE);
  }
}

// Resolves server-authoritative fulfillment pricing: validates the delivery
// address and computes the raw delivery fee + distance. Free delivery
// eligibility is NOT resolved here because the item subtotal is unknown at
// this point in the checkout flow — it is computed separately in the checkout
// routes after cart resolution.
export async function resolveCheckoutFulfillment({
  fulfillmentType,
  branch,
  shippingAddress,
  reservation,
  pickupTime,
  session,
}: FulfillmentPayload & {
  branch: BranchWithCoordinates;
  session?: ClientSession;
}) {
  const normalizedFulfillmentType = normalizeFulfillmentType(fulfillmentType);

  if (normalizedFulfillmentType === FULFILLMENT_TYPE.PICKUP) {
    if (!session) {
      throw new Error("Session is required for pickup time validation.");
    }
    await validatePickupTimePayload(pickupTime, session);
    return {
      fulfillmentType: normalizedFulfillmentType,
      shippingAddress: undefined,
      deliveryFee: 0,
      distanceKm: 0,
      billableKm: 0,
      pickupTime,
    };
  }

  // Dine-in: no delivery fee, no shipping address — validate reservation against operating hours
  if (normalizedFulfillmentType === FULFILLMENT_TYPE.DINE_IN) {
    if (!session) {
      throw new Error("Session is required for dine-in reservation validation.");
    }
    await validateReservationPayload(reservation, session);
    return {
      fulfillmentType: normalizedFulfillmentType,
      shippingAddress: undefined,
      deliveryFee: 0,
      distanceKm: 0,
      billableKm: 0,
    };
  }

  await validateFulfillmentPayload({
    fulfillmentType: normalizedFulfillmentType,
    shippingAddress,
  });

  const branchCoordinates = branch.location?.coordinates;
  const deliveryCoordinates = shippingAddress?.coordinates;

  if (!isBranchCoordinates(branchCoordinates) || !deliveryCoordinates) {
    throw new Error("Delivery fee cannot be calculated for this order.");
  }

  return {
    fulfillmentType: normalizedFulfillmentType,
    shippingAddress,
    ...calculateDeliveryFeeFromCoordinates(branchCoordinates, deliveryCoordinates),
  };
}
