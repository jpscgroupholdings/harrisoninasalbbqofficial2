import Modal from "@/components/ui/Modal";
import { DynamicIcon } from "@/lib/DynamicIcon";
import { OrderType } from "@/types/OrderTypes";
import React from "react";

interface CancelOrderType {
  order: OrderType;
  setIsCancel: (props: boolean) => void;
  handleCancelOrder: (id: string) => void;
  isLoading: boolean;
}

const CancelOrderModal = ({
  order,
  setIsCancel,
  handleCancelOrder,
  isLoading,
}: CancelOrderType) => {
  return (
    <Modal
      onClose={() => setIsCancel(false)}
      title="Cancel Order"
      subTitle="That's totally fine. We'll take care of everything on our end."
    >
      <div className="flex flex-col gap-4">
        <p className="text-xl text-gray-500">
          Are you sure you want to cancel{" "}
          {order.paymentInfo?.referenceNumber || ""}
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => setIsCancel(false)}
            className="py-1.5 px-4 rounded-lg border border-gray-300 text-gray-600 text-lg font-medium hover:bg-gray-50 cursor-pointer"
          >
            Back
          </button>
          <button
            onClick={() => {
              handleCancelOrder(order._id);
              setIsCancel(false);
            }}
            disabled={isLoading}
            className="py-1.5 px-4 rounded-lg bg-red-500 hover:bg-red-600 text-white text-lg font-medium disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
          >
            {isLoading && (
              <DynamicIcon name="Loader2" size={14} className="animate-spin" />
            )}
            {isLoading ? "Cancelling order... " : "Cancel"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CancelOrderModal;
