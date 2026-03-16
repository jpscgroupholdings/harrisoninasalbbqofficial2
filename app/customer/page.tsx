import PromoBannerV2 from "@/components/customer/homepage/PromoBannerV2";
import LocationsSection from "@/components/customer/homepage/Location";
import MenuSection from "@/components/customer/homepage/MenuSection";
import StickyScrollProducts from "@/components/customer/homepage/StickyScrollProducts";
import MenuSectionSkeleton from "@/components/ui/MenuSectionSkeleton";
import { Suspense } from "react";
import EventsCTA from "@/components/EventsCTA";
import PromoBanner from "@/components/customer/homepage/PromoBanner";

export default function Home() {
  return (
    <>
      {/* <PromoBannerV2 /> */}
      <div  className="max-w-7xl mx-auto my-12">
        <PromoBanner type="single"/>
      </div>
      <Suspense fallback={<MenuSectionSkeleton />}>
        <MenuSection />
      </Suspense>
      {/* <StickyScrollProducts /> */}
      <LocationsSection />
      <EventsCTA />
    </>
  );
}
