// ─── Sub-components ───────────────────────────────────────────────────────────

import { IconButton } from "@/components/ui/buttons";
import { InputField } from "@/components/ui/FormComponents";

export const QuantityStepper = ({
  value,
  onChange,
  min = 0,
  max,
}: {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
}) => {
  // Clamp a value between min and max (if max is defined)
  const clamp = (v: number) => {
    let result = Math.max(min, v);
    if (max !== undefined) result = Math.min(max, result);
    return result;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    // Allow empty while typing
    if (raw === "") {
      onChange(min);
      return;
    }

    const parsed = Number(raw);

    if (isNaN(parsed)) return;

    onChange(clamp(parsed));
  };

  return (
    <div className="flex items-center gap-0 border border-gray-200 overflow-hidden h-full">
      <IconButton
        onClick={() => onChange(clamp(value - 1))}
        icon={{ name: "Minus", size: 12 }}
        variant="secondary"
        className="place-self-stretch"
        disabled={value <= min}
      />

      <InputField
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={handleInputChange}
        className="max-w-32 p-0 rounded-none outline-none border-0 text-center"
      />
      <IconButton
        onClick={() => onChange(clamp(value + 1))}
        icon={{ name: "Plus", size: 12 }}
        className="place-self-stretch"
        disabled={max !== undefined && value >= max}
      />
    </div>
  );
};
