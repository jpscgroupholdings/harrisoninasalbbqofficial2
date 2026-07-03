import { Search } from "lucide-react";
import { InputField } from "./FormComponents/InputField";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChange,
  onSearch,
  placeholder,
}: SearchBarProps) {
  return (
    <InputField
      type="text"
      label="Search"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && onSearch()}
      rightElement={
        <button
          onClick={onSearch}
          className="flex items-center gap-2 cursor-pointer px-4 hover:text-brand-color-500"
        >
          <Search size={16} />
          Search
        </button>
      }
    />
  );
}
