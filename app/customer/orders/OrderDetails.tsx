"use client";

import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { StatusBadge } from "./StatusBadge";
import { useOrders } from "@/hooks/api/useOrders";

interface OrderDetailsProps {
  orderId: string;
}

export default function OrderDetails({ orderId }: OrderDetailsProps) {
  const { data: placedOrders, isLoading } = useOrders();
  const router = useRouter();
  const order = placedOrders?.find((o) => o._id === orderId);

  const [showAllItems, setShowAllItems] = useState(false);
  const ITEMS_TO_SHOW = 3;

  useEffect(() => {
    // After hydration, if no order found, redirect
    if (!isLoading && !order) {
      router.push("/orders");
    }
  }, [isLoading, order, router]);

  // If no order after loading, show nothing (redirect will happen)
  if (!order) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const timeAgo = formatDistanceToNow(new Date(order.createdAt), {
    addSuffix: true,
  });

  return (
    <div
      className={`space-y-6 max-w-5xl max-h-[calc(100vh-100px)] overflow-y-auto mx-auto p-4 hide-scrollbar`}
    >
      {/* Header */}
      <div className="border-b pb-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h2 className={`font-bold`}>
              Order #{" "}
              <span className="uppercase text-gray-400">
                {order.paymentInfo.referenceNumber}
              </span>
            </h2>
            <p className="text-sm text-gray-500">
              Placed {timeAgo} • {formatDate(order.createdAt)}
            </p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        {order.estimatedTime && (
          <p className="text-sm text-gray-600">
            <strong>Estimated:</strong> {order.estimatedTime}
          </p>
        )}
      </div>

      {/* Order Timeline */}
      {order.timeline && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold mb-3">Order Timeline</h3>
          <div className="space-y-2 text-sm">
            {order.timeline.paidAt && (
              <div className="flex justify-between">
                <span className="text-gray-600">💳 Paid</span>
                <span>{formatDate(order.timeline.paidAt)}</span>
              </div>
            )}
            {order.timeline.preparingAt && (
              <div className="flex justify-between">
                <span className="text-gray-600">👨‍🍳 Preparing</span>
                <span>{formatDate(order.timeline.preparingAt)}</span>
              </div>
            )}
            {order.timeline.dispatchedAt && (
              <div className="flex justify-between">
                <span className="text-gray-600">🚗 Dispatched</span>
                <span>{formatDate(order.timeline.dispatchedAt)}</span>
              </div>
            )}
            {order.timeline.readyAt && (
              <div className="flex justify-between">
                <span className="text-gray-600">✅ Ready</span>
                <span>{formatDate(order.timeline.readyAt)}</span>
              </div>
            )}
            {order.timeline.completedAt && (
              <div className="flex justify-between">
                <span className="text-gray-600">🎉 Completed</span>
                <span>{formatDate(order.timeline.completedAt)}</span>
              </div>
            )}
            {order.timeline.cancelledAt && (
              <div className="flex justify-between">
                <span className="text-gray-600">❌ Cancelled</span>
                <span>{formatDate(order.timeline.cancelledAt)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dispatch Info */}
      {order.dispatchInfo && order.status === "dispatched" && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold mb-2 flex items-center">
            🚗 Delivery Information
          </h3>
          <div className="space-y-1 text-sm">
            <p>
              <strong>Rider:</strong> {order.dispatchInfo.riderName}
            </p>
            <p>
              <strong>Phone:</strong> {order.dispatchInfo.riderPhone}
            </p>
            <p>
              <strong>Vehicle:</strong> {order.dispatchInfo.vehicleType}
            </p>
          </div>
        </div>
      )}

      {/* Items */}
      <div>
        <h3 className="font-semibold mb-3">Order Items</h3>
        <div className="space-y-3">
          {(showAllItems
            ? order.items
            : order.items.slice(0, ITEMS_TO_SHOW)
          ).map((item, index) => (
            <div
              key={`${item._id}-${index}`}
              className="flex gap-3 border-b pb-3"
            >
              <div className="relative w-16 h-16 shrink-0 rounded overflow-hidden bg-gray-100">
                <Image
                  src={item.image || "/images/harrison_logo.png"}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">{item.name}</h4>
                <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  ₱{(item.price * item.quantity).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">
                  ₱{item.price.toFixed(2)} each
                </p>
              </div>
            </div>
          ))}

          {/* View more/less button with linear overlay */}
          {order.items.length > ITEMS_TO_SHOW && (
            <div className="relative -mx-4">
              {!showAllItems && (
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-linear-to-t from-white via-white/60 to-transparent pointer-events-none" />
              )}
              <button
                type="button"
                onClick={() => setShowAllItems(!showAllItems)}
                className="relative bg-linear-to-b from-white to-gray-200 w-full py-3 text-sm text-[#ef4501] hover:text-[#c13500] font-semibold transition-colors cursor-pointer border-t border-gray-200"
              >
                {showAllItems
                  ? "Show Less"
                  : `+${order.items.length - ITEMS_TO_SHOW} More Item/s`}
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Order Summary */}
      <div className="pt-4">
        <h3 className="font-semibold mb-3">Order Summary</h3>
        {/* Fix the summary to include tax */}
        <div className="pt-4 border-t border-gray-100 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-[550]">
              ₱{order.total?.subTotal?.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax (12%)</span>
            <span className="font-[550]">
              ₱{(order.total.total - order.total.subTotal).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
            <span className="text-gray-900">Total</span>
            <span className="text-[#ef4501]">
              ₱{order.total?.total?.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm">
            <strong>Note:</strong> {order.notes}
          </p>
        </div>
      )}
    </div>
  );
}
