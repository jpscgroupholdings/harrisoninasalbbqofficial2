"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { OrderType } from "@/types/OrderTypes";
import { CUSTOMER_CANCEL_REASONS } from "@/types/orderConstants";
import { TextareaField, SelectField } from "@/components/ui/FormComponents";
import { IconButton } from "@/components/ui/buttons";

interface CancelOrderType {
  order: OrderType;
  setIsCancel: (props: boolean) => void;
  handleCancelOrder: (id: string, reason?: string, notes?: string) => void;
  isLoading: boolean;
}

const CancelOrderModal = ({
  order,
  setIsCancel,
  handleCancelOrder,
  isLoading,
}: CancelOrderType) => {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const reasonOptions = CUSTOMER_CANCEL_REASONS.map((r) => ({
    value: r,
    label: r,
  }));

  const canSubmit = reason.length > 0;

  return (
    <Modal
      onClose={() => setIsCancel(false)}
      title="Cancel Order"
      subTitle="That's totally fine. We'll take care of everything on our end."
    >
      <div className="flex flex-col gap-5">
        <p className="text-lg text-gray-500">
          Are you sure you want to cancel{" "}
          <span className="font-semibold text-gray-700">
            {order.paymentInfo?.referenceNumber || ""}
          </span>
          ?
        </p>

        <SelectField
          label="Reason for cancellation"
          required
          options={[
            { value: "", label: "Select a reason...", disabled: true },
            ...reasonOptions,
          ]}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

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
            onClick={() => setIsCancel(false)}
            variant="outline"
            text="Back"
            className="rounded-lg px-4"
          />
          <IconButton
            onClick={() => {
              handleCancelOrder(order._id, reason, notes || undefined);
              setIsCancel(false);
            }}
            disabled={!canSubmit || isLoading}
            text={isLoading ? "Cancelling order..." : "Cancelc Order"}
            className="rounded-lg px-4"
            icon={{
              name: isLoading ? "Loader2" : null,
              className: "animate-spin",
            }}
          />
        </div>
      </div>
    </Modal>
  );
};

export default CancelOrderModal;
