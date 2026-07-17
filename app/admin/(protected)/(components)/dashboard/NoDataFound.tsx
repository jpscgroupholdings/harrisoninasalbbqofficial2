import { DynamicIcon } from "@/components/ui/DynamicIcon";

export const NoDataFound = ({
  iconName = "CircleOff",
  text = "No data yet",
  subText = "Data will show here. Try to refresh the page",
}: {
  iconName: string;
  text: string;
  subText: string;
}) => (
  <div className="flex flex-col items-center justify-center h-70 text-center px-6">
    <div className="relative mb-4">
      <div className="w-16 h-16 bg-brand-color-100 rounded-2xl flex items-center justify-center">
        <DynamicIcon
          name={iconName}
          size={24}
          className="text-brand-color-500"
        />
      </div>
    </div>
    <p className="text-sm font-semibold text-gray-800 mb-1">{text}</p>
    <p className="text-xs text-gray-400 leading-relaxed max-w-50">{subText}</p>
  </div>
);
