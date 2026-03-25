"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { Branch } from "@/types/branch";
import { useBranches } from "@/hooks/api/useBranch";

type BranchContextType = {
  selectedBranch: Branch | null;
  setSelectedBranch: (branch: Branch | null) => void;
};

const BranchContext = createContext<BranchContextType | null>(null);

export const BranchProvider = ({ children }: { children: ReactNode }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: branches = [] } = useBranches();

  // Load only the ID from localStorage, not the full object
  useEffect(() => {
    try {
      const savedId = localStorage.getItem("selected_branch_id");
      if (savedId) setSelectedId(savedId);
    } catch (error) {
      console.error(error);
    }
  }, []);

  // Always resolve against fresh API data — never stale
  const selectedBranch = branches.find((b) => b._id === selectedId) ?? null;

  const setSelectedBranch = (branch: Branch | null) => {
    setSelectedId(branch?._id ?? null);

    if (branch?._id) {
      localStorage.setItem("selected_branch_id", branch._id);
    } else {
      localStorage.removeItem("selected_branch_id");
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