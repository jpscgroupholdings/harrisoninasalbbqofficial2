import Image from "next/image";
import Link from "next/link";
import React from "react";
import { cn } from "@/lib/utils";

const BrandLogo = ({
  color = "normal",
  className,
}: {
  color?: "white" | "normal";
  className?: string;
}) => {
  return (
    <Link href={"/"} className="cursor-pointer">
      <div className="flex items-center">
        <Image
          src={
            color === "normal"
              ? "/images/harrison_logo_landscape.png"
              : "/images/harrison_logo_landscape_white.png"
          }
          alt="Harrison"
          width={240}
          height={60}
          priority
          quality={92}
          className={cn("h-8 w-auto md:h-10 lg:h-12", className)}
          sizes="(max-width: 500px) 120px, (max-width: 1024px) 180px, 240px"
        />
      </div>
    </Link>
  );
};

export default BrandLogo;