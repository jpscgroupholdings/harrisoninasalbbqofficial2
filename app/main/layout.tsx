import Header from "./components//Header";
import Footer from "@/components/ui/Footer";
import MenuSectionSkeleton from "@/components/ui/MenuSectionSkeleton";
import React, { Suspense } from "react";
import NewHeader from "./components/newdesign/NewHeader";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<MenuSectionSkeleton />}>
        {/* <Header /> */}
        <NewHeader />
      </Suspense>
      {children}
      <Footer variant="marketing"/>
    </>
  );
}
