"use client";

import { useState } from "react";
import { DynamicIcon } from "@/lib/DynamicIcon";

export const OrderItemImage = ({
  image,
  name = "Order item",
}: {
  image?: string;
  name?: string;
}) => {
  const [hasError, setHasError] = useState(false);

  if (!image || hasError) {
    return (
      <div
        role="img"
        aria-label={`${name} image not available`}
        className="w-full h-full flex flex-col items-center justify-center bg-orange-50"
      >
        <DynamicIcon
          name="Flame"
          size={20}
          className="text-orange-200"
          aria-hidden="true"
        />
        <p className="text-xs text-gray-500">No image found</p>
      </div>
    );
  }

  return (
    <img
      src={image}
      alt={name}
      className="w-full h-full object-cover"
      onError={() => setHasError(true)}
    />
  );
};