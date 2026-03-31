"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { Branch } from "@/types/branch";
import { useBranches } from "@/hooks/api/useBranch";

type BranchContextType = {
  selectedBranch: Branch | null;
  setSelectedBranch: (branch: Branch | null) => void;

  userLocation: [number, number] | null;
  setUserLocation: (location: [number, number] | null) => void;
};

const BranchContext = createContext<BranchContextType | null>(null);

const LOCATION_KEY = "user_map_location";
const SELECTED_BRANCH_KEY = "selected_branch_id";

const loadLocation = (): [number, number] | null => {
  try {
    const raw = sessionStorage.getItem(LOCATION_KEY);
    return raw ? (JSON.parse(raw) as [number, number]) : null;
  } catch {
    return null;
  }
};

const saveLocation = (location: [number, number] | null) => {
  try {
    if (location) {
      sessionStorage.setItem(LOCATION_KEY, JSON.stringify(location));
    } else {
      sessionStorage.removeItem(LOCATION_KEY);
    }
  } catch {
    // sessionStorage blocked (e.g. private browsing restrictions) — silent fail
  }
};

export const BranchProvider = ({ children }: { children: ReactNode }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [userLocation, setUserLocationState] = useState<[number, number] | null>(loadLocation);
  const { data: branches = [] } = useBranches();

  // Load selected branch ID from sessionStorage on mount
  useEffect(() => {
    try {
      const savedId = sessionStorage.getItem(SELECTED_BRANCH_KEY);
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
      sessionStorage.setItem(SELECTED_BRANCH_KEY, branch._id);
    } else {
      sessionStorage.removeItem(SELECTED_BRANCH_KEY);
    }
  };

  const setUserLocation = (location: [number, number] | null) => {
    setUserLocationState(location);
    saveLocation(location);
  };

  return (
    <BranchContext value={{ selectedBranch, setSelectedBranch, userLocation, setUserLocation }}>
      {children}
    </BranchContext>
  );
};

export const useBranch = () => {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error("useBranch must be used within BranchProvider");
  return ctx;
};