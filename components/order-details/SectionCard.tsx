import { cn } from "@/lib/utils";
import { IconButton } from "../ui/buttons";

/** Collapsible card with toggle header and expandable content */
export const SectionCard = ({
  section,
  title,
  expanded,
  onToggle,
  children,
}: {
  section: string;
  title: string;
  expanded: boolean;
  onToggle: (section: string) => void;
  children: React.ReactNode;
}) => (
  <div className="bg-white">
    <IconButton
      onClick={() => onToggle(section)}
      text={title}
      icon={{
        name: expanded ? "ChevronUp" : "ChevronDown",
        size: 16,
        position: "right",
      }}
      variant="ghost"
      className={cn(
        "w-full flex justify-start",
        expanded && "text-brand-color-500",
      )}
    />
    {expanded && (
      <div className="border-t border-gray-100 py-3 px-2">{children}</div>
    )}
  </div>
);
