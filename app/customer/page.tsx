import PromoBannerV2 from "@/app/customer/components/PromoBannerV2";
import LocationsSection from "@/app/customer/components/Location";
import MenuSection from "@/app/customer/components/MenuSection";
import StickyScrollProducts from "@/app/customer/components/StickyScrollProducts";
import MenuSectionSkeleton from "@/components/ui/MenuSectionSkeleton";
import { Suspense } from "react";
import EventsCTA from "@/components/EventsCTA";
import PromoBanner from "@/app/customer/components/PromoBanner";

export default function Home() {
  return (
    <>
      {/* <PromoBannerV2 /> */}
      <div className="max-w-360 mx-auto mt-12 mb-3">
        <div className="mx-4">
          <Suspense fallback={<MenuSectionSkeleton />}>
            <MenuSection /> {/** Includes the banner */}
          </Suspense>
        </div>
      </div>
      {/* <StickyScrollProducts /> */}
      <LocationsSection />
      <EventsCTA />
    </>
  );
}
