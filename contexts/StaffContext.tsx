"use client";

import LoadingPage from "@/components/ui/LoadingPage";
import { useAdminMe } from "@/hooks/api/useAuthMe";
import { Staff } from "@/types/staff";
import { createContext, useContext } from "react";

const StaffContext = createContext<Staff | null | undefined>(undefined);

export const StaffProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: admin, isLoading } = useAdminMe();
    if (isLoading) {
    return <LoadingPage />; // or skeleton
  }
  return (
    <StaffContext.Provider value={admin ?? null}>
      {children}
    </StaffContext.Provider>
  );
};

export const useStaffContext = () => {
  const ctx = useContext(StaffContext);

  if (!ctx)
    throw new Error("useStaffContext must be used within StaffProvider");
  return ctx;
};
