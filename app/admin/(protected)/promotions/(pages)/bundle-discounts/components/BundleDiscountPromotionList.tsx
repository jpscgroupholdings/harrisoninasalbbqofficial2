"use client";

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatDateOnly } from "@/helper/formatDate";
import { formatTime } from "@/helper/formatTime";
import { Fragment, useState } from "react";
import { getDiscountLabel } from "../../product-discounts/helpers/getDiscountLabel";
import {
  getPromotionStatus,
  promotionStatusLabels,
  promotionStatusStyles,
} from "../../product-discounts/helpers/getPromotionStatus";
import { BundleDiscountPromotion } from "../type";

type BundleDiscountPromotionListProps = {
  promotions: BundleDiscountPromotion[];
};

function getCreatorName(promotion: BundleDiscountPromotion) {
  const creator = promotion.createdBy;
  if (!creator) return "Unknown";

  const fullName = [creator.firstName, creator.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || creator.email || "Unknown";
}

function getBundleQuantity(promotion: BundleDiscountPromotion) {
  return promotion.products.reduce(
    (total, product) => total + product.quantity,
    0,
  );
}

export function BundleDiscountPromotionList({
  promotions,
}: BundleDiscountPromotionListProps) {
  const [expandedPromotionId, setExpandedPromotionId] = useState<string | null>(
    null,
  );

  return (
    <div className="rounded-xl border border-stone-100 bg-white p-6 shadow-sm">
      {promotions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-stone-200 px-4 py-10 text-center">
          <p className="text-sm font-semibold text-stone-700">
            No bundle discount promotions yet.
          </p>
          <p className="mt-1 text-sm text-stone-500">
            Create one to discount product bundles with required quantities.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table className="w-full min-w-225 text-left text-sm">
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold">Name</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Bundle</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Redemptions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>CreatedAt</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promotions.map((promotion) => {
                const status = getPromotionStatus(promotion);
                const isExpanded = expandedPromotionId === promotion._id;
                const bundleQuantity = getBundleQuantity(promotion);

                return (
                  <Fragment key={promotion._id}>
                    <tr className="border-b border-stone-100 last:border-0">
                      <td className="px-3 py-4">
                        <p className="font-bold text-stone-800">
                          {promotion.name}
                        </p>
                        <p className="text-xs text-stone-500">
                          {formatDateOnly(promotion.startsAt)}{" "}
                          {formatTime(promotion.startTime)} -{" "}
                          {formatDateOnly(promotion.endsAt, "No end date")}{" "}
                          {formatTime(promotion.endTime)}
                        </p>
                      </td>
                      <td className="px-3 py-4 font-medium text-stone-700">
                        {getDiscountLabel(promotion)}
                      </td>
                      <td className="px-3 py-4 text-stone-600">
                        <p>
                          {promotion.products.length} product
                          {promotion.products.length === 1 ? "" : "s"}
                        </p>
                        <p className="text-xs text-stone-500">
                          {bundleQuantity} required item
                          {bundleQuantity === 1 ? "" : "s"}
                        </p>
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
                      <td className="px-3 py-4 text-stone-600">
                        {getCreatorName(promotion)}
                      </td>
                      <td className="px-3 py-4 text-stone-600">
                        {formatDate(promotion.createdAt)}
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedPromotionId(
                                isExpanded ? null : promotion._id,
                              )
                            }
                            className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-bold text-stone-700 hover:border-brand-color-500"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="border-b border-stone-100 bg-stone-50">
                        <td colSpan={9} className="px-3 py-4">
                          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {promotion.products.map((product) => (
                              <div
                                key={product.product}
                                className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white p-3"
                              >
                                {product.imageUrl ? (
                                  <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="h-12 w-12 rounded-md object-cover"
                                  />
                                ) : (
                                  <div className="h-12 w-12 rounded-md bg-stone-100" />
                                )}
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-bold text-stone-800">
                                    {product.name}
                                  </p>
                                  <p className="text-xs text-stone-500">
                                    Qty {product.quantity} |{" "}
                                    {product.price === null
                                      ? "Range priced"
                                      : `PHP ${product.price.toFixed(2)}`}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
