import { getDistanceMeters } from "./deliveryArea";
import { roundMoney } from "./money";

type Coordinates = {
  lat: number;
  lng: number;
};

export type BranchGeoJsonCoordinates = [number, number];

export type DeliveryFeeEstimate = {
  distanceKm: number; // distance from branch to delivery location, in km
  billableKm: number; // rounded up distance used for billing
  deliveryFee: number; // calculated delivery fee based on billable distance
};

export type EffectiveDeliveryFee = DeliveryFeeEstimate & {
  freeDeliveryEligible: boolean; // whether free delivery applies based on subtotal and distance
  effectiveDeliveryFee: number;  // actual fee charged (0 if free delivery, otherwise the calculated fee)
  freeDeliveryReason?: string;   // why free delivery does not apply (if not eligible)
};

const BASE_DELIVERY_FARE = 49;
const FIRST_TIER_KM = 5;
const FIRST_TIER_RATE = 6;
const EXCESS_TIER_RATE = 5;

// Free delivery: waived when item subtotal ≥ threshold AND distance is within the max km.
// Distance exceeding the max km disqualifies free delivery even if the subtotal threshold is met.
// Toggle via NEXT_PUBLIC_FREE_DELIVERY_ENABLED env var — set "false" to disable (e.g. after promo period).
export const FREE_DELIVERY_MINIMUM_PURCHASE = 500;
export const FREE_DELIVERY_MAX_DISTANCE_KM = 5;
export const FREE_DELIVERY_ENABLED =
  process.env.NEXT_PUBLIC_FREE_DELIVERY_ENABLED !== "false";

// how far is the delivery location from the branch, in km? Used for delivery fee calculation and estimation.
export const getBranchToDeliveryDistanceKm = (
  branchCoordinates: BranchGeoJsonCoordinates,
  deliveryCoordinates: Coordinates,
) => {
  const [branchLng, branchLat] = branchCoordinates;
  const distanceMeters = getDistanceMeters(
    { lat: branchLat, lng: branchLng },
    deliveryCoordinates,
  );

  return distanceMeters / 1000; // convert to km
};

export const calculateDeliveryFee = (
  distanceKm: number,
): DeliveryFeeEstimate => {
  if (!Number.isFinite(distanceKm) || distanceKm < 0) {
    throw new Error("Distance must be a valid non-negative number.");
  }

  const billableKm = Math.round(distanceKm); // round to nearest whole km for billing; e.g. 5.2km becomes 5km, 5.5km becomes 6km
  const firstTierKm = Math.min(billableKm, FIRST_TIER_KM);
  const excessKm = Math.max(billableKm - FIRST_TIER_KM, 0);

  // Delivery fee is base fare + distance charge, with rates depending on whether the distance falls within the first tier or exceeds it.
  const deliveryFee = roundMoney(
    BASE_DELIVERY_FARE +
      firstTierKm * FIRST_TIER_RATE +
      excessKm * EXCESS_TIER_RATE,
  );

  return {
    distanceKm: Number(distanceKm.toFixed(2)),
    billableKm,
    deliveryFee,
  };
};

// Determines the effective delivery fee, applying free delivery when the item subtotal
// meets the minimum purchase threshold AND the delivery distance is within the allowed range.
// Free delivery is disqualified if the distance exceeds FREE_DELIVERY_MAX_DISTANCE_KM,
// even when the purchase threshold is met.
export const resolveEffectiveDeliveryFee = (
  distanceKm: number,
  itemSubtotalAmount: number,
): EffectiveDeliveryFee => {
  const estimate = calculateDeliveryFee(distanceKm);

  // When free delivery is disabled (promo ended), behave as if the feature doesn't exist.
  if (!FREE_DELIVERY_ENABLED) {
    return {
      ...estimate,
      freeDeliveryEligible: false,
      effectiveDeliveryFee: estimate.deliveryFee,
      freeDeliveryReason: undefined,
    };
  }

  const exceedsMaxDistance = distanceKm > FREE_DELIVERY_MAX_DISTANCE_KM;
  const meetsMinimumPurchase = itemSubtotalAmount >= FREE_DELIVERY_MINIMUM_PURCHASE;
  const freeDeliveryEligible = meetsMinimumPurchase && !exceedsMaxDistance;

  const effectiveDeliveryFee = freeDeliveryEligible ? 0 : estimate.deliveryFee;

  let freeDeliveryReason: string | undefined;
  if (!freeDeliveryEligible && isDeliveryFeeScenario(distanceKm, itemSubtotalAmount)) {
    if (exceedsMaxDistance) {
      freeDeliveryReason = `Free delivery is only available within ${FREE_DELIVERY_MAX_DISTANCE_KM} km.`;
    } else {
      const amountNeeded = roundMoney(FREE_DELIVERY_MINIMUM_PURCHASE - itemSubtotalAmount);
      freeDeliveryReason = `Add ₱${amountNeeded.toFixed(2)} more to get free delivery within ${FREE_DELIVERY_MAX_DISTANCE_KM} km.`;
    }
  }

  return {
    ...estimate,
    freeDeliveryEligible,
    effectiveDeliveryFee,
    freeDeliveryReason,
  };
};

// Whether free delivery messaging is relevant — only for delivery scenarios with a positive distance.
const isDeliveryFeeScenario = (distanceKm: number, itemSubtotalAmount: number) =>
  distanceKm > 0 && itemSubtotalAmount > 0;

// Convenience function to calculate delivery fee estimate directly from branch and delivery coordinates.
export const calculateDeliveryFeeFromCoordinates = (
  branchCoordinates: BranchGeoJsonCoordinates,
  deliveryCoordinates: Coordinates,
) => {
  const distanceKm = getBranchToDeliveryDistanceKm(
    branchCoordinates,
    deliveryCoordinates,
  );
  return calculateDeliveryFee(distanceKm);
};

// Convenience: resolve effective delivery fee (with free delivery logic) from coordinates + subtotal.
export const resolveEffectiveDeliveryFeeFromCoordinates = (
  branchCoordinates: BranchGeoJsonCoordinates,
  deliveryCoordinates: Coordinates,
  itemSubtotalAmount: number,
) => {
  const distanceKm = getBranchToDeliveryDistanceKm(
    branchCoordinates,
    deliveryCoordinates,
  );
  return resolveEffectiveDeliveryFee(distanceKm, itemSubtotalAmount);
};
