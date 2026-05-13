"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Package, Star } from "lucide-react";
import { toast } from "sonner";
import { FormTextarea } from "@/components/ui/FormTextArea";
import { useCustomerOrder } from "@/hooks/api/customers/useCustomerOrders";
import { useSubmitReview } from "@/hooks/api/customers/useSubmitReview";
import { ItemReviewInput } from "@/types/ReviewTypes";

// ─── Star Row ─────────────────────────────────────────────────────────────────

const StarRow = ({
  value,
  onChange,
  size = "md",
}: {
  value: number;
  onChange: (v: number) => void;
  size?: "sm" | "md" | "lg";
}) => {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;
  const dim = size === "lg" ? "w-12 h-12" : size === "sm" ? "w-7 h-7" : "w-9 h-9";

  return (
    <div className="flex items-center gap-1 group">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className={`transition-transform focus:outline-none active:scale-150 cursor-pointer ${
            star <= display ? "group-hover:scale-110" : ""
          }`}
        >
          <Star
            className={`${dim} transition-all duration-150`}
            fill={star <= display ? "#ef4501" : "#e5e7eb"}
            stroke={star <= display ? "#c13500" : "#d1d5db"}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const LABELS = ["No rating", "Poor 😓", "Fair 😐", "Good 🙂", "Very Good 😋", "Excellent 😍"];
const ITEMS_TO_SHOW = 3;

const ReviewPage = () => {
  const params = useParams();
  const router = useRouter();
  const orderId = String(params.id ?? "");

  const { data: order, isPending: isLoading } = useCustomerOrder(orderId);
  const { mutateAsync: submitReview, isPending: isSubmitting } = useSubmitReview(orderId);

  // ── Order-level state ──────────────────────────────────────────────────────
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  // ── Item-level state: map of productId → { rating, comment } ──────────────
  const [itemRatings, setItemRatings] = useState<
    Record<string, { rating: number | null; comment: string }>
  >({});

  const [showAllItems, setShowAllItems] = useState(false);

  // ── Guard: redirect if not reviewable ─────────────────────────────────────
  useEffect(() => {
    if (!order) return;

    if (order.isReviewed) {
      toast.info("You've already reviewed this order!");
      router.push("/orders");
      return;
    }

    if (order.status !== "completed") {
      toast.warning("You can only review completed orders");
      router.push("/orders");
      return;
    }

    // Pre-populate item map so we always have an entry per item
    const initial: Record<string, { rating: number | null; comment: string }> = {};
    order.items.forEach((item) => {
      initial[item.productId] = { rating: null, comment: "" };
    });
    setItemRatings(initial);
  }, [order]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const setItemRating = (productId: string, value: number) => {
    setItemRatings((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], rating: value },
    }));
  };

  const setItemComment = (productId: string, value: string) => {
    setItemRatings((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], comment: value },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error("Please provide an overall rating");
      return;
    }

    // Build itemReviews — only include items that have at least a rating or comment
    const itemReviews: ItemReviewInput[] = order!.items
      .map((item) => {
        const ir = itemRatings[item.productId];
        return {
          productId: item.productId,
          name: item.name,
          image: item.image ?? null,
          rating: ir?.rating ?? null,
          comment: ir?.comment?.trim() || null,
        };
      })
      .filter((ir) => ir.rating !== null || ir.comment);

    try {
      await submitReview({ rating, comment: comment.trim() || undefined, itemReviews });
      toast.success("Thank you for your review!");
      router.push("/orders");
    } catch (error: any) {
      const msg = error?.message ?? "Failed to submit review. Please try again.";
      toast.error(msg);
    }
  };

  // ── Render states ──────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading order...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Order not found.</div>
      </div>
    );
  }

  const displayedItems = showAllItems ? order.items : order.items.slice(0, ITEMS_TO_SHOW);

  return (
    <div className="bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">

          {/* ── Header ── */}
          <div className="mb-8">
            <h1 className="text-brand-color-500 text-2xl md:text-3xl font-bold mb-2">
              Rate Your Experience
            </h1>
            <p className="text-slate-600 font-semibold">
              Order #{order.paymentInfo.referenceNumber}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Completed on {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">

            {/* ── Overall Rating ── */}
            <div className="space-y-4">
              <label className="font-[550] text-gray-700">
                Overall Experience <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-col items-center gap-3 py-4">
                <StarRow value={rating} onChange={setRating} size="lg" />
                {rating > 0 && (
                  <p className="text-lg font-semibold text-brand-color-500">
                    {LABELS[rating]}
                  </p>
                )}
              </div>
              <FormTextarea
                label="Overall Comment (Optional)"
                name="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What did you love? What could be better?"
                rows={3}
              />
            </div>

            {/* ── Per-Item Ratings ── */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-[550] text-gray-700">
                  Rate Individual Items{" "}
                  <span className="text-gray-400 font-normal text-sm">(Optional)</span>
                </h3>
              </div>

              <div className="space-y-4">
                {displayedItems.map((item, idx) => (
                  <div
                    key={`${item.productId}-${idx}`}
                    className="p-4 bg-gray-50 rounded-xl space-y-3"
                  >
                    {/* Item header */}
                    <div className="flex gap-3 items-center">
                      <div className="w-14 h-14 shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package size={20} className="text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-gray-500">qty: {item.quantity}</p>
                      </div>
                      <div className="shrink-0">
                        <StarRow
                          value={itemRatings[item.productId]?.rating ?? 0}
                          onChange={(v) => setItemRating(item.productId, v)}
                          size="sm"
                        />
                      </div>
                    </div>

                    {/* Item comment — only show if item has been rated */}
                    {(itemRatings[item.productId]?.rating ?? 0) > 0 && (
                      <textarea
                        value={itemRatings[item.productId]?.comment ?? ""}
                        onChange={(e) => setItemComment(item.productId, e.target.value)}
                        placeholder={`Anything about ${item.name}? (optional)`}
                        rows={2}
                        className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-brand-color-500/30 focus:border-brand-color-500 transition"
                      />
                    )}
                  </div>
                ))}

                {order.items.length > ITEMS_TO_SHOW && (
                  <button
                    type="button"
                    onClick={() => setShowAllItems(!showAllItems)}
                    className="w-full py-2 text-sm text-brand-color-500 hover:text-[#c13500] font-semibold transition-colors cursor-pointer"
                  >
                    {showAllItems
                      ? "Show Less"
                      : `+${order.items.length - ITEMS_TO_SHOW} More Items`}
                  </button>
                )}
              </div>
            </div>

            {/* ── Submit ── */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting || rating === 0}
                className="flex-1 bg-brand-color-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#c13500] transition-colors disabled:bg-gray-300 disabled:hover:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Submit Review"}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Skip for Now
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Your feedback helps us improve our service
        </p>
      </div>
    </div>
  );
};

export default ReviewPage;