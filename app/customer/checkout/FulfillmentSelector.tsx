"use client";

import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { OrderFormState } from "./FormSchema";
import { FULFILLMENT_TYPE } from "@/types/orderConstants";

type FulfillmentSelectorProps = {
  value: OrderFormState["fulfillmentType"];
  onChange: (value: OrderFormState["fulfillmentType"]) => void;
};

const options = [
  {
    value: FULFILLMENT_TYPE.DELIVERY,
    label: "Delivery",
    description: "Send the order to your pinned address.",
    icon: "Truck",
  },
  {
    value: FULFILLMENT_TYPE.PICKUP,
    label: "Pickup",
    description: "Collect the order from the selected branch.",
    icon: "Store",
  },
];

export function FulfillmentSelector({
  value,
  onChange,
}: FulfillmentSelectorProps) {
  return (
    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {options.map((option) => {
        const isSelected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
              isSelected
                ? "border-brand-color-500 bg-brand-color-50 text-slate-900"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
          >
            <span
              className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                isSelected
                  ? "bg-brand-color-500 text-white"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              <DynamicIcon name={option.icon} size={17} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">
                {option.label}
              </span>
              <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                {option.description}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
