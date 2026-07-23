// ─── Sub-components ───────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { IconButton } from "@/components/ui/buttons";
import { InputField } from "@/components/ui/FormComponents";

export const QuantityStepper = ({
  value,
  onChange,
  min = 0,
  max,
  className,
}: {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  className?: string;
}) => {
  /** Local display value — lets the user clear the field without immediately
   *  triggering a parent update (which could e.g. remove the cart item). */
  const [display, setDisplay] = useState(String(value));

  // Keep local display in sync when the parent value changes externally
  useEffect(() => {
    setDisplay(String(value));
  }, [value]);

  // Clamp a value between min and max (if max is defined)
  const clamp = (v: number) => {
    let result = Math.max(min, v);
    if (max !== undefined) result = Math.min(max, result);
    return result;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    // Allow the user to clear the field while typing — don't call onChange yet
    if (raw === "") {
      setDisplay("");
      return;
    }

    // Block non-numeric characters that number inputs still allow (e, +, -)
    if (!/^\d+$/.test(raw)) return;

    const parsed = Number(raw);
    if (isNaN(parsed)) return;

    setDisplay(raw);
    onChange(clamp(parsed));
  };

  /** On blur, restore the display to the last committed parent value
   *  if the field was left empty or invalid. */
  const handleBlur = () => {
    if (display === "" || Number(display) < min) {
      setDisplay(String(value));
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-0 border border-gray-200 overflow-hidden h-full",
        className,
      )}
    >
      <IconButton
        onClick={() => onChange(clamp(value - 1))}
        icon={{ name: "Minus", size: 12 }}
        variant="secondary"
        className="place-self-stretch"
        disabled={value <= min}
      />

      <InputField
        type="number"
        value={display}
        min={min}
        max={max}
        onChange={handleInputChange}
        onBlur={handleBlur}
        className="max-w-12 p-0 rounded-none outline-none border-0 text-center"
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
