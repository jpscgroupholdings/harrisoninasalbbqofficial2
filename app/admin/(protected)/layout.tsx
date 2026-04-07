import React from "react";
import ClienLayout from "./ClientLayout";
import { StaffProvider } from "@/contexts/StaffContext";

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
      <StaffProvider>
        <ClienLayout>{children}</ClienLayout>
      </StaffProvider>
  );
};

export default layout;
  