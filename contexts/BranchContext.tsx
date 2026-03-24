"use client";

import { Branch } from "@/app/customer/map/mockupData";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

type BranchContextType = {
  selectedBranch: Branch | null;
  setSelectedBranch: (branch: Branch | null) => void;
};

const BranchContext = createContext<BranchContextType | null>(null);

export const BranchProvider = ({ children }: { children: ReactNode }) => {
  const [selectedBranch, setSelectedBranchState] = useState<Branch | null>(
    null,
  );
  // Load from locatStorage once on mount (avoid SSR warnign)
  useEffect(() => {
    try {
      const savedBranch = localStorage.getItem("selected_branch");
      if (savedBranch) setSelectedBranchState(JSON.parse(savedBranch));
    } catch (error) {
      console.error(error);
    }
  }, []);

  const setSelectedBranch = (branch: Branch | null) => {
    setSelectedBranchState(branch);

    if (branch) {
      localStorage.setItem("selected_branch", JSON.stringify(branch));
    } else {
      localStorage.removeItem("selected_branch");
    }
  };

  return (
    <BranchContext value={{ selectedBranch, setSelectedBranch }}>
      {children}
    </BranchContext>
  );
};

export const useBranch = () => {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error("useBranch must be used within BranchProvider");
  return ctx;
};
