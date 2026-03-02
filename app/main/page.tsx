import HeroVideo from "@/components/main/HeroBanner";
import MainLocationSection from "@/components/main/MainLocationSection";
import MissionVision from "@/components/main/MissionVision";
import ProductMain from "@/components/main/ProductMain";

const MainPage = () => {
  return (
    <>
      <HeroVideo />
      <ProductMain />
      <MissionVision />
      <MainLocationSection /> {/** Includes order now CTA */}
    </>
  );
};

export default MainPage;
