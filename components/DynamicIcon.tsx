import { getLucideIcon } from "@/helper/iconUtils";

export const DynamicIcon = ({
  name,
  size = 15,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) => {
  const IconComponent = getLucideIcon(name);
  return IconComponent ? (
    <IconComponent size={size} className={className} />
  ) : null;
};