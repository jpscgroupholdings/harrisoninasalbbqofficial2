// ─── Sub-components ───────────────────────────────────────────────────────────

import { IconButton } from "@/components/ui/buttons";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { InputField } from "@/components/ui/FormComponents";

export const QuantityStepper = ({
  value,
  onChange,
  min = 0,
}: {
  value: number;
  onChange: (val: number) => void;
  min?: number;
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    // Allow empty while typing
    if (raw === "") {
      onChange(min);
      return;
    }

    const parsed = Number(raw);

    if (isNaN(parsed)) return;

    onChange(Math.max(min, parsed));
  };

  return (
    <div className="flex items-center gap-0 border border-gray-200 overflow-hidden h-full">
      <IconButton
        onClick={() => onChange(Math.max(min, value - 1))}
        icon={{ name: "Minus", size: 12 }}
        variant="secondary"
        className="place-self-stretch"
      />

      <InputField
        type="number"
        value={value}
        min={min}
        onChange={handleInputChange}
        className="max-w-32 p-0 rounded-none outline-none border-0 text-center"
      />
      <IconButton
        onClick={() => onChange(value + 1)}
        icon={{ name: "Plus", size: 12 }}
        className="place-self-stretch"
      />
    </div>
  );
};
