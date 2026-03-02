import PromoBannerV2 from "@/components/customer/homepage/PromoBannerV2";
import BestSellers from "@/components/customer/homepage/BestSellers";
import LocationsSection from "@/components/customer/homepage/Location";
import MenuSection from "@/components/customer/homepage/MenuSection";
import StickyScrollProducts from "@/components/customer/homepage/StickyScrollProducts";
import StorySection from "@/components/customer/homepage/StorySection";
import MenuSectionSkeleton from "@/components/ui/MenuSectionSkeleton";
import { Suspense } from "react";

export default function Home() {
  return (
    <>
      <PromoBannerV2 />
      <Suspense fallback={<MenuSectionSkeleton />}>
        <MenuSection variant="landing" />
      </Suspense>
      <StorySection />
      <BestSellers />
      <StickyScrollProducts />
      <LocationsSection />
    </>
  );
}
