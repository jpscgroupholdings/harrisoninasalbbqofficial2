import LocationsSection from "../../components/Location";
import CTA from "./components/CTA";
import CarouselBanner from "./components/HeroBanner";
import MissionVision from "./components/MissionVision";
import BookYourTable from "./components/newdesign/BookYourTable";
import FAQs from "./components/newdesign/FAQs";
import MenuSection from "./components/newdesign/MenuSection";
import Subscribe from "./components/newdesign/Subscribe";

const MainPage = () => {
  return (
    <main>
      <CarouselBanner />
      <MenuSection />
      <MissionVision />
      <BookYourTable />
      <LocationsSection />
      <FAQs />
      <Subscribe />
      <CTA />
    </main>
  );
};

export default MainPage;
