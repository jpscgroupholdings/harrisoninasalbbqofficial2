import About from "@/app/main/components/About";
import CTA from "@/app/main/components/CTA";
import HeroVideo from "@/app/main/components/HeroBanner";
import MainIntro from "@/app/main/components/MainIntro";
import Promotion from "@/app/main/components/Promotion";
import WhatWeServe from "@/app/main/components/WhatWeServe";

const MainPage = () => {
  return (
    <>
      <HeroVideo />
      <MainIntro />
      <About />
      <WhatWeServe />
      <Promotion />
      <CTA />
    </>
  );
};

export default MainPage;
