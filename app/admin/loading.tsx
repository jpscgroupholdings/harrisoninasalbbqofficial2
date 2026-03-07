import { Loader2 } from "lucide-react";
import React from "react";

const page = () => {
  return (
    <div className="absolute inset-0 bg-black/30 z-50 flex flex-col items-center justify-center h-screen">
      <Loader2 size={50} className="text-brand-color-500 animate-spin" />
      <p className="text-white">Loading...</p>
    </div>
  );
};

export default page;
