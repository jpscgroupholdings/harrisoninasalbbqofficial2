import Header from "./components//Header";
import Footer from "@/components/ui/Footer";
import React, { Suspense } from "react";
import NewHeader from "./components/newdesign/NewHeader";
import HeaderSkeleton from "../customer/components/HeaderSkeleton";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<HeaderSkeleton />}>
        {/* <Header /> */}
        <NewHeader />
      </Suspense>
      {children}
      <Footer variant="marketing"/>
    </>
  );
}
