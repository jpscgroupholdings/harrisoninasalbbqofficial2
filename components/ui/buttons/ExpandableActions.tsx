import { useRef } from "react";
import { cn } from "@/lib/utils";
import { useOnClickOutside } from "@/hooks/useOnClickOutside";
import IconButton, { IconButtonProps } from "./IconButton";

export type ActionItem = Omit<IconButtonProps, "onClick"> & {
  key: string;
  onClick: () => void;
};

interface ExpandableActionsProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose?: () => void;
  actions: ActionItem[];
  triggerIcon?: IconButtonProps["icon"];
  triggerTitle?: string;
  className?: string;
  triggerClassName?: string;
}

export function ExpandableActions({
  isOpen,
  onToggle,
  onClose,
  actions,
  triggerIcon = { name: "MoreHorizontal", size: 15 },
  triggerTitle = "More actions",
  className,
  triggerClassName,
}: ExpandableActionsProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(wrapperRef, () => onClose?.() ?? onToggle(), isOpen);

  return (
    <div
      ref={wrapperRef}
      className={cn("relative flex items-center shrink-0", className)}
    >
      {isOpen && (
        <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2 flex flex-col items-center gap-2 whitespace-nowrap rounded-xl bg-white p-2 shadow-xl z-50">
          {actions.map(({ key, ...action }) => (
            <IconButton
              key={key}
              type="button"
              {...action}
              className={cn("p-4 rounded-lg w-full justify-start", action.className)}
            />
          ))}
        </div>
      )}
      <IconButton
        type="button"
        variant="secondary"
        icon={triggerIcon}
        title={triggerTitle}
        onClick={onToggle}
        className={cn("p-4 rounded-lg", triggerClassName)}
      />
    </div>
  );
}