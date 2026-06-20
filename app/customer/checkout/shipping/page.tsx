'use client'

import React from "react";
import ShippingAddress from "./ShippingAddress";
import { useCheckoutContext } from "@/contexts/CheckoutContext";

const page = () => {
  const {
    orderDetails,
    shippingErrors,
    shouldShowSyncProfileDetails,
    syncCheckoutDetailsFromProfile,
    openModal,
    handleStateChange,
    handleShippingCoordinatesChange,
    validateField,
  } = useCheckoutContext();

  const handleShippingBlur = (field: string, value: string) => {
    validateField("shippingAddress", field, value);
  };

  const handleCoordinatesChange = (
    coordinates: typeof orderDetails.shippingAddress.coordinates,
  ) => {
    handleShippingCoordinatesChange(coordinates);
    validateField("shippingAddress", "coordinates", coordinates);
  };
    
  return (
    <ShippingAddress
      shippingAddress={orderDetails.shippingAddress}
      errors={shippingErrors}
      shouldShowSyncProfileDetails={shouldShowSyncProfileDetails}
      onSyncProfileDetails={syncCheckoutDetailsFromProfile}
      openModal={openModal}
      onChange={handleStateChange}
      onBlur={handleShippingBlur}
      onCoordinatesChange={handleCoordinatesChange}
    />
  );
};

export default page;
