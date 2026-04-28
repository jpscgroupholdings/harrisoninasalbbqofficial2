"use client";

import { DynamicIcon } from "@/lib/DynamicIcon";
import { useBranch } from "@/contexts/BranchContext";
import { MODAL_TYPES, ModalType } from "@/hooks/utils/useModalQuery";

interface Props {
  mounted: boolean;
  onOpen: (type: ModalType) => void;
}

export const HeaderBranchButton = ({ mounted, onOpen }: Props) => {
  const { selectedBranch } = useBranch();

  return (
    <button
      onClick={() => onOpen(MODAL_TYPES.MAP)}
      className="flex items-center justify-center gap-2 bg-brand-color-100 hover:bg-brand-color-50 hover:text-brand-color-600 text-brand-color-500 px-4 py-2 text-sm font-bold rounded-full transition-colors cursor-pointer max-w-35 sm:max-w-none"
    >
      <DynamicIcon name="MapPin" size={16} className="shrink-0" />
      <span className="truncate">
        {mounted ? (selectedBranch ? selectedBranch.name : "Select Branch") : "Select Branch"}
      </span>
      <DynamicIcon name="ChevronDown" size={16} className="shrink-0" />
    </button>
  );
};