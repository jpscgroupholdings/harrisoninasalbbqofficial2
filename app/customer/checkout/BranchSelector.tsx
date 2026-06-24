// BranchSelector.tsx
"use client";

import { useEffect, useState } from "react";
import { SelectField } from "@/components/ui/SelectField";
import { useBranch } from "@/contexts/BranchContext";
import { useBranches } from "@/hooks/api/useBranch";
import { Branch } from "@/types/branch";

type BranchSelectorProps = {
  selectedBranch?: Branch | null;
};

const BranchSelector = ({ selectedBranch }: BranchSelectorProps) => {
  const { setSelectedBranch } = useBranch();
  const { data: branches = [] } = useBranches();

  // Prevent hydration mismatch — server has no sessionStorage / React Query cache
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const branch = branches.find((b) => b._id === e.target.value);
    setSelectedBranch(branch ?? null);
  };

  if (!mounted) {
    return (
      <SelectField
        value=""
        onChange={() => {}}
        options={[{ value: "", label: "Select Branch", disabled: true }]}
        className="border-none text-brand-color-500"
      />
    );
  }

  function truncate(str: string, max = 40) {
    return str.length > max ? str.slice(0, max) + "…" : str;
  }

  return (
    <SelectField
      value={selectedBranch ? selectedBranch._id : ""}
      onChange={handleChange}
      options={[
        { value: "", label: "Select Branch", disabled: true },
        ...branches.map((branch) => ({
          value: branch._id,
          label: truncate(`${branch.name} - ${branch.address}`),
        })),
      ]}
      className="border-none text-brand-color-500 whitespace-nowrap overflow-hidden text-ellipsis wrap-break-word"
    />
  );
};

export default BranchSelector;
