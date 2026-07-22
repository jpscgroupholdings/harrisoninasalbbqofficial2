"use client";

import React, { useEffect, useRef } from "react";
import CustomerDetails from "./CustomerDetails";
import { useCheckoutContext } from "@/contexts/CheckoutContext";
import { useCart } from "@/contexts/CartContext";
import { FULFILLMENT_TYPE } from "@/types/orderConstants";
import { DetailsFormSkeleton } from "../CheckoutFormSkeleton";
import { trackInitiateCheckout } from "@/lib/metaPixel";
import { ReservationPicker } from "../ReservationPicker";
import { PickupTimePicker } from "../PickupTimePicker";
import { useSettings } from "@/hooks/api/useSettings";

const page = () => {
  const {
    session,
    orderDetails,
    customerErrors,
    reservationErrors,
    pickupTimeError,
    shouldShowSyncProfileDetails,
    syncCheckoutDetailsFromProfile,
    handleStateChange,
    handleReservationChange,
    handlePickupTimeChange,
    validateField,
    isReady,
  } = useCheckoutContext();

  const { cartItems, totalItems, totalPrice } = useCart();
  const { data: settings } = useSettings();
  const hasTrackedRef = useRef(false);
  const isDineIn = orderDetails.fulfillmentType === FULFILLMENT_TYPE.DINE_IN;
  const isPickup = orderDetails.fulfillmentType === FULFILLMENT_TYPE.PICKUP;

  // Fire InitiateCheckout once when the checkout details page mounts
  useEffect(() => {
    if (isReady && !hasTrackedRef.current) {
      hasTrackedRef.current = true;
      const contentCategory = isDineIn
        ? "Reservation"
        : orderDetails.fulfillmentType === FULFILLMENT_TYPE.DELIVERY
          ? "Delivery"
          : "Pickup";
      trackInitiateCheckout({
        content_ids: cartItems.map((item) => item._id),
        content_type: "product",
        content_category: contentCategory,
        currency: "PHP",
        num_items: totalItems,
        value: totalPrice,
      });
    }
  }, [isReady, orderDetails.fulfillmentType, totalItems, totalPrice]);

  if (!isReady) {
    return <DetailsFormSkeleton />;
  }

  return (
    <>
      <CustomerDetails
        customerData={orderDetails.customer}
        errors={customerErrors}
        isAuthenticated={Boolean(session?.user)}
        isDelivery={orderDetails.fulfillmentType === FULFILLMENT_TYPE.DELIVERY}
        shouldShowSyncProfileDetails={shouldShowSyncProfileDetails}
        onSyncProfileDetails={syncCheckoutDetailsFromProfile}
        onChange={handleStateChange}
        onBlur={(field, value) => validateField("customer", field, value)}
      />

      {/* Show reservation picker for dine-in orders */}
      {isDineIn && (
        <ReservationPicker
          value={orderDetails.reservation}
          onChange={handleReservationChange}
          errors={reservationErrors}
          operatingHours={settings?.operatingHours}
        />
      )}

      {/* Show pickup time picker for pickup orders */}
      {isPickup && (
        <PickupTimePicker
          value={orderDetails.pickupTime}
          onChange={handlePickupTimeChange}
          error={pickupTimeError}
          operatingHours={settings?.operatingHours}
        />
      )}
    </>
  );
};

export default page;
