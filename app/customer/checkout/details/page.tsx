"use client";

import React, { useEffect, useRef } from "react";
import CustomerDetails from "./CustomerDetails";
import { useCheckoutContext } from "@/contexts/CheckoutContext";
import { useCart } from "@/contexts/CartContext";
import { FULFILLMENT_TYPE } from "@/types/orderConstants";
import { DetailsFormSkeleton } from "../CheckoutFormSkeleton";
import { trackInitiateCheckout } from "@/lib/metaPixel";

const page = () => {
  const {
    session,
    orderDetails,
    customerErrors,
    shouldShowSyncProfileDetails,
    syncCheckoutDetailsFromProfile,
    handleStateChange,
    validateField,
    isReady,
  } = useCheckoutContext();

  const { cartItems, totalItems, totalPrice } = useCart();
  const hasTrackedRef = useRef(false);

  // Fire InitiateCheckout once when the checkout details page mounts
  useEffect(() => {
    if (isReady && !hasTrackedRef.current) {
      hasTrackedRef.current = true;
      trackInitiateCheckout({
        content_ids: cartItems.map((item) => item._id),
        content_type: "product",
        content_category: orderDetails.fulfillmentType === FULFILLMENT_TYPE.DELIVERY ? "Delivery" : "Pickup",
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
  );
};

export default page;
