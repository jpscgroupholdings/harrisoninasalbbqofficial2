import LocationsSection from "../customer/components/Location";
import About from "./components/About";
import CTA from "./components/CTA";
import CarouselBanner from "./components/HeroBanner";
import MainIntro from "./components/MainIntro";
import BookYourTable from "./components/newdesign/BookYourTable";
import FAQs from "./components/newdesign/FAQs";
import FoundersNote from "./components/newdesign/FoundersNote";
import MenuSection from "./components/newdesign/MenuSection";
import Subscribe from "./components/newdesign/Subscribe";
import Promotion from "./components/Promotion";
import WhatWeServe from "./components/WhatWeServe";

const MainPage = () => {
  return (
    <>
      <CarouselBanner />
      {/* <MainIntro /> */}
      {/* <About /> */}
      <MenuSection />
      <BookYourTable />
      <FoundersNote />
      <FAQs />
      {/* <WhatWeServe /> */}
      {/* <Promotion /> */}
      <LocationsSection />
      <Subscribe />
      <CTA />
    </>
  );
};

export default MainPage;
