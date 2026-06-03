"use client";

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/helper/formatCurrency";
import { formatDate } from "@/helper/formatDate";
import { apiClient } from "@/lib/apiClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getDiscountLabel } from "../helpers/getDiscountLabel";
import {
  getPromotionStatus,
  promotionStatusLabels,
  promotionStatusStyles,
} from "../helpers/getPromotionStatus";
import { OrderDiscountPromotion } from "../types";

type PromotionListProps = {
  promotions: OrderDiscountPromotion[];
};

export function PromotionList({ promotions }: PromotionListProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const deletePromotion = useMutation({
    mutationFn: (promotionId: string) =>
      apiClient.delete<{ success: boolean }>(
        `/admin/order-discount-promotions/${promotionId}`,
      ),
    onSuccess: async () => {
      toast.success("Order discount promotion deleted.");
      await queryClient.invalidateQueries({
        queryKey: ["admin", "order-discount-promotions"],
      });
    },
    onError: (error: { message?: string }) => {
      toast.error(
        error.message ?? "Failed to delete order discount promotion.",
      );
    },
  });

  const handleDelete = (promotion: OrderDiscountPromotion) => {
    const confirmed = window.confirm(
      `Delete "${promotion.name}"? This cannot be undone.`,
    );

    if (!confirmed) return;
    deletePromotion.mutate(promotion._id);
  };

  return (
    <div className="rounded-xl border border-stone-100 bg-white p-6 shadow-sm">
      {promotions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-stone-200 px-4 py-10 text-center">
          <p className="text-sm font-semibold text-stone-700">
            No order discount promotions yet.
          </p>
          <p className="mt-1 text-sm text-stone-500">
            Create one to configure a whole-order discount.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table className="w-full min-w-225 text-left text-sm">
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold">Name</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Minimum</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Redemptions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promotions.map((promotion) => {
                const status = getPromotionStatus(promotion);

                return (
                  <tr
                    key={promotion._id}
                    className="border-b border-stone-100 last:border-0"
                  >
                    <td className="px-3 py-4">
                      <p className="font-bold text-stone-800">
                        {promotion.name}
                      </p>
                      <p className="text-xs text-stone-500">
                        {formatDate(promotion.startsAt)} -{" "}
                        {formatDate(promotion.endsAt, "No end Date")}
                      </p>
                    </td>
                    <td className="px-3 py-4 font-medium text-stone-700">
                      {getDiscountLabel(promotion)}
                    </td>
                    <td className="px-3 py-4 text-stone-600">
                      {formatCurrency(promotion.minimumOrderAmount)}
                    </td>
                    <td className="px-3 py-4 text-stone-600">
                      <p>
                        {promotion.dayMode === "opening_days"
                          ? "Opening days"
                          : promotion.days.join(", ")}
                      </p>
                      <p className="text-xs text-stone-500">
                        {promotion.startTime} - {promotion.endTime}
                      </p>
                    </td>
                    <td className="px-3 py-4 text-stone-600">
                      {promotion.redemptionCount} /{" "}
                      {promotion.maximumRedemptions ?? "No limit"}
                    </td>
                    <td className="px-3 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${promotionStatusStyles[status]}`}
                      >
                        {promotionStatusLabels[status]}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/promotions/order-discounts/${promotion._id}/edit`,
                            )
                          }
                          className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-bold text-stone-700 hover:border-brand-color-500"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={deletePromotion.isPending}
                          onClick={() => handleDelete(promotion)}
                          className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
