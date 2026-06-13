import React from "react";
import ClienLayout from "./ClientLayout";

const layout = ({ children }: { children: React.ReactNode }) => {
  return <ClienLayout>{children}</ClienLayout>;
};

export default layout;
