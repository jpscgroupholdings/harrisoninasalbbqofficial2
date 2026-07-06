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
        className="w-full h-full flex flex-col items-center justify-center bg-gray-50"
      >
        <DynamicIcon
          name="FileX"
          size={20}
          className="text-brand-color-400"
          aria-hidden="true"
        />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {!imageLoaded && (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 ">
          <DynamicIcon
            name="Loader2"
            size={20}
            className="text-gray-300 animate-spin"
          />
        </div>
      )}

      <img
        ref={imgRef}
        src={image}
        alt={name}
        className={twMerge(
          "w-full h-full object-cover transition-opacity duration-200",
          imageLoaded ? "opacity-100" : "opacity-0",
          className,
        )}
        onLoad={() => setImageLoaded(true)}
        onError={() => setHasError(true)}
      />
    </div>
  );
};
