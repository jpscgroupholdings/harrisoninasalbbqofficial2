"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { InputField, TextareaField, SelectField } from "./ui/FormComponents";
import { IconButton } from "./ui/buttons";

interface Props {
  title: string;
  subTitle?: string;
  /** Reference number or order ID to display in the confirmation text */
  referenceLabel: string;
  /** Predefined reason options */
  reasons: readonly string[];
  /** Label for the confirm button */
  confirmLabel: string;
  /** Tailwind class for the confirm button background */
  confirmVariant?: string;
  /** Whether to show an amount input (for refunds) */
  showAmountInput?: boolean;
  /** Default amount value */
  defaultAmount?: number;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: (data: { reason: string; notes: string; amount?: number }) => void;
}

/**
 * Shared modal for status changes that require a reason (cancel, expire, refund).
 * Renders a reason dropdown, optional notes textarea, and optional amount input.
 */
export default function ConfirmationWithReasonModal({
  title,
  subTitle,
  referenceLabel,
  reasons,
  confirmLabel,
  confirmVariant = "bg-red-500 hover:bg-red-600",
  showAmountInput = false,
  defaultAmount,
  isLoading,
  onClose,
  onConfirm,
}: Props) {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [amount, setAmount] = useState<number | undefined>(defaultAmount);

  const reasonOptions = reasons.map((r) => ({ value: r, label: r }));

  const canSubmit =
    reason.length > 0 && (!showAmountInput || (amount != null && amount > 0));

  const handleSubmit = () => {
    if (!canSubmit) return;
    onConfirm({ reason, notes, amount });
  };

  return (
    <Modal onClose={onClose} title={title} subTitle={subTitle}>
      <div className="flex flex-col gap-5">
        <p className="text-lg text-gray-500">
          Are you sure you want to {confirmLabel.toLowerCase()}{" "}
          <span className="font-semibold text-gray-700">{referenceLabel}</span>?
        </p>

        <SelectField
          label="Reason"
          required
          options={[
            { value: "", label: "Select a reason...", disabled: true },
            ...reasonOptions,
          ]}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        {showAmountInput && (
          <InputField
            label="Refund Amount"
            type="number"
            value={amount ?? ""}
            onChange={(e) =>
              setAmount(e.target.value ? parseFloat(e.target.value) : undefined)
            }
            placeholder="0.00"
            leftIcon={<DynamicIcon name="DollarSign" />}
            required
          />
        )}

        <TextareaField
          label="Notes (Optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Add any additional details..."
        />

        <div className="flex gap-2 justify-end">
          <IconButton
            onClick={onClose}
            variant="outline"
            text="Back"
            className="rounded-lg px-4"
          />
          <IconButton
            onClick={handleSubmit}
            disabled={!canSubmit || isLoading}
            text={isLoading ? "Processing..." : confirmLabel}
            icon={{
              name: isLoading ? "Loader2" : null,
              className: "animate-spin",
            }}
            className={`rounded-lg px-4 ${confirmVariant}`}
          />
        </div>
      </div>
    </Modal>
  );
}
