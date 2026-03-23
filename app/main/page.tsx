import About from "./components/About";
import CTA from "./components/CTA";
import CarouselBanner from "./components/HeroBanner";
import MainIntro from "./components/MainIntro";
import Promotion from "./components/Promotion";
import WhatWeServe from "./components/WhatWeServe";



const MainPage = () => {
  return (
    <>
      <CarouselBanner />
      <MainIntro />
      <About />
      <WhatWeServe />
      <Promotion />
      <CTA />
    </>
  );
};

export default MainPage;
