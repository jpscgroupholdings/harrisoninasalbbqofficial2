import { useEffect, useRef, useState } from "react";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { twMerge } from "tailwind-merge";

export const OrderItemImage = ({
  image,
  name = "Order item",
  className,
}: {
  image?: string;
  name?: string;
  className?: string;
}) => {
  const [hasError, setHasError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setImageLoaded(false);
    setHasError(false);

    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setImageLoaded(true);
    }
  }, [image]);

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
    <div className="relative w-full h-full">
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
          <div className="flex flex-col items-center justify-center gap-2">
            <DynamicIcon
              name="ShoppingBag"
              size={32}
              className="text-gray-300"
            />
            <p className="text-gray-300 text-xs">Loading image...</p>
          </div>
        </div>
      )}

      <img
        ref={imgRef}
        src={image}
        alt={name}
        className={twMerge(
          "w-full h-full object-cover transition-opacity duration-200",
          imageLoaded ? "opacity-100" : "opacity-0",
          className
        )}
        onLoad={() => setImageLoaded(true)}
        onError={() => setHasError(true)}
      />
    </div>
  );
};