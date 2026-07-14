"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { multiplyMoney, roundMoney } from "@/lib/money";
import { trackViewContent, trackAddToCart } from "@/lib/metaPixel";
import { useCart } from "@/contexts/CartContext";
import { useBranch } from "@/contexts/BranchContext";
import { ModifierSelection, ModifierSelectionItem } from "@/types/MenuTypes";
import { ModifierGroup, ModifierItem } from "@/types/products";
import { ITEM_TYPES } from "@/types/products";
import StarRatingDisplay from "@/components/ui/StarRating";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { useProductReviews } from "@/hooks/api/customers/useProductReviews";
import { apiClient } from "@/lib/apiClient";
import { BranchProduct } from "@/hooks/api/useBranchProductInfinite";
import { formatCurrency } from "@/helper/formatCurrency";
import { STOCK_STATUSES } from "@/types/inventory_types";
import { QuantityStepper } from "../../menu/components/QuantityStepper";
import { useQuery } from "@tanstack/react-query";
import { AppImage } from "@/components/AppImage";
import { IconButton } from "@/components/ui/buttons";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PopulatedModifierProduct {
  _id: string;
  name: string;
  price: number | null;
  image: { url: string; public_id?: string };
  productType: string;
}

type PopulatedModifierItem = Omit<ModifierItem, "product"> & {
  product: PopulatedModifierProduct;
};

type PopulatedModifierGroup = Omit<ModifierGroup, "items"> & {
  items: PopulatedModifierItem[];
};

// ─── Skeleton ──────────────────────────────────────────────────────────────────

const ProductDetailSkeleton = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="w-full max-w-4xl mx-auto p-6 animate-pulse">
      <div className="h-6 w-32 bg-gray-200 rounded mb-4" />
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/2 aspect-square bg-gray-200 rounded-xl" />
        <div className="w-full md:w-1/2 space-y-4">
          <div className="h-8 w-3/4 bg-gray-200 rounded" />
          <div className="h-4 w-1/2 bg-gray-200 rounded" />
          <div className="h-6 w-24 bg-gray-200 rounded" />
          <div className="h-20 w-full bg-gray-200 rounded" />
          <div className="h-12 w-full bg-gray-200 rounded mt-4" />
        </div>
      </div>
    </div>
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────

const ProductDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const { selectedBranch } = useBranch();
  const branchId = selectedBranch?._id;
  const { addToCart } = useCart();

  const {
    data: product,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["product", productId, branchId],
    queryFn: async () => {
      const query = branchId ? `?branchId=${branchId}` : "";
      const res = await apiClient.get<{
        success: boolean;
        data: BranchProduct;
      }>(`/customer/products/${productId}${query}`);
      return res.data;
    },
    enabled: !!productId,
  });

  // ── Fetch reviews ──────────────────────────────────────────────────────────
  const { data: reviewData } = useProductReviews(productId, { limit: 1 });
  const averageRating = reviewData?.averageRating ?? 0;
  const totalReviews = reviewData?.totalReviews ?? 0;

  // ── Modifier state ──────────────────────────────────────────────────────────
  // Maps groupId → (productId → quantity). Quantity 0 means "not selected".
  const [activeTab, setActiveTab] = useState<"info" | "desc">("info");
  const [mainQty, setMainQty] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [modifierQuantities, setModifierQuantities] = useState<
    Map<string, Map<string, number>>
  >(new Map());

  // ── Derived state ──────────────────────────────────────────────────────────
  // ── Derived state (null-safe: `product` may still be null here) ────────────
  const hasModifierGroups =
    !!product &&
    product.productType !== ITEM_TYPES.SOLO &&
    (product.modifierGroups?.length ?? 0) > 0;
  const populatedGroups: PopulatedModifierGroup[] = (product?.modifierGroups ??
    []) as PopulatedModifierGroup[];
  const isCombo = product?.productType === ITEM_TYPES.COMBO;
  const isSet = product?.productType === ITEM_TYPES.SET;

  // ── Computed: upgrade pricing ──────────────────────────────────────────────
  const upgradeTotal = useMemo(() => {
    if (!hasModifierGroups) return 0;
    let sum = 0;
    for (const group of populatedGroups) {
      const groupQtyMap = modifierQuantities.get(group._id ?? "");
      if (!groupQtyMap) continue;
      for (const modItem of group.items) {
        const qty = groupQtyMap.get(modItem.product._id) ?? 0;
        if (qty > 0) {
          const upgradePrice = modItem.price ?? modItem.product.price ?? 0;
          sum += upgradePrice * qty;
        }
      }
    }
    return roundMoney(sum);
  }, [hasModifierGroups, populatedGroups, modifierQuantities]);

  const basePrice = product?.price ?? 0;
  const activeProductDiscount = product?.activeProductDiscount;
  const hasProductDiscount =
    Boolean(activeProductDiscount) && activeProductDiscount!.discountAmount > 0;
  const displayUnitPrice = hasModifierGroups
    ? roundMoney(basePrice + upgradeTotal)
    : hasProductDiscount
      ? activeProductDiscount!.discountedPrice
      : basePrice;
  const total = multiplyMoney(displayUnitPrice, mainQty);

  // ── Modifier validation ──────────────────────────────────────────────────────
  const modifierValidationErrors = useMemo(() => {
    if (!hasModifierGroups) return [];
    const errors: string[] = [];
    for (const group of populatedGroups) {
      const groupQtyMap = modifierQuantities.get(group._id ?? "");
      // Count how many distinct items have quantity > 0
      const selectedCount = groupQtyMap
        ? [...groupQtyMap.values()].filter((q) => q > 0).length
        : 0;
      if (group.required && selectedCount < group.minSelect) {
        errors.push(`${group.name}: select at least ${group.minSelect}`);
      }
    }
    return errors;
  }, [hasModifierGroups, populatedGroups, modifierQuantities]);

  const canAddToCart = modifierValidationErrors.length === 0;

  // ── Stock info ──────────────────────────────────────────────────────────────
  const quantity = branchId ? (product?.quantity ?? 0) : null;
  const status = branchId ? (product?.status ?? "") : "";
  const isOutOfStock = Boolean(
    branchId &&
    (status === STOCK_STATUSES.OUT_OF_STOCK || (quantity ?? 1) <= 0),
  );

  // ── Fire ViewContent pixel ── (also moved above the early returns) ────────
  React.useEffect(() => {
    if (!product) return;
    trackViewContent({
      content_ids: [product._id],
      content_type: "product",
      content_name: product.name,
      content_category: product.category?.name ?? "Menu Item",
      currency: "PHP",
      value: product.price ?? 0,
    });
  }, [product]);

  // ── Modifier selection handlers ──────────────────────────────────────────────
  /** Toggle a modifier item on/off and set/update its quantity */
  const setModifierItemQty = (
    groupId: string,
    productId: string,
    maxSelect: number,
    newQty: number,
  ) => {
    setModifierQuantities((prev) => {
      const next = new Map(prev);
      const groupMap = new Map(next.get(groupId) ?? new Map<string, number>());

      if (newQty <= 0) {
        // Remove the item
        groupMap.delete(productId);
      } else {
        // Check maxSelect constraint: count distinct selected items (qty > 0)
        const currentSelectedCount = [...groupMap.values()].filter(
          (q) => q > 0,
        ).length;
        // If this is a new selection (was 0 or absent), ensure we don't exceed maxSelect
        if (!groupMap.has(productId) && currentSelectedCount >= maxSelect) {
          if (maxSelect === 1) {
            // Radio-style group: switch selection instead of blocking
            groupMap.clear();
          } else {
            // Checkbox-style group already at capacity — require manual deselect
            return prev; // no change — already at max
          }
        }
        groupMap.set(productId, newQty);
      }

      next.set(groupId, groupMap);
      return next;
    });
  };

  // ── Loading / error states ──────────────────────────────────────────────────
  if (isLoading) return <ProductDetailSkeleton />;
  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <DynamicIcon name="AlertCircle" size={48} className="text-red-400" />
        <p className="text-gray-500">{error?.message || "Product not found"}</p>
        <IconButton
          onClick={() => router.back()}
          text="Go back"
          title="Back to menu"
        />
      </div>
    );
  }

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleAddToCart = () => {
    if (!canAddToCart) return;

    const selections: ModifierSelection[] = hasModifierGroups
      ? (populatedGroups
          .map((group) => {
            const groupQtyMap = modifierQuantities.get(group._id ?? "");
            if (!groupQtyMap) return null;
            // Only include items with quantity > 0
            const items: ModifierSelectionItem[] = group.items
              .filter(
                (modItem) => (groupQtyMap.get(modItem.product._id) ?? 0) > 0,
              )
              .map((modItem) => ({
                productId: modItem.product._id,
                name: modItem.product.name,
                label: modItem.label,
                upgradePrice: modItem.price ?? modItem.product.price ?? 0,
                quantity: groupQtyMap.get(modItem.product._id) ?? 1,
              }));
            if (items.length === 0) return null;
            return {
              groupId: group._id ?? "",
              groupName: group.name,
              required: group.required,
              minSelect: group.minSelect,
              maxSelect: group.maxSelect,
              items,
            };
          })
          .filter(Boolean) as ModifierSelection[])
      : [];

    addToCart({
      _id: product._id,
      name: product.name,
      price: hasModifierGroups
        ? roundMoney(basePrice + upgradeTotal)
        : basePrice,
      image: product.image.url,
      activeProductDiscount: hasModifierGroups ? null : activeProductDiscount,
      productType: product.productType,
      modifierSelections: selections,
      category: {
        _id: product.category._id,
        name: product.category.name,
      },
      quantity: mainQty,
    });

    trackAddToCart({
      content_ids: [product._id],
      content_type: "product",
      content_name: product.name,
      content_category: product.category?.name ?? "Menu Item",
      currency: "PHP",
      value: displayUnitPrice,
    });

    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
      router.back();
    }, 1500);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen bg-gray-50`}>
      {/* Back button */}
      <div className="sticky top-22 z-30 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <IconButton
            icon={{ name: "ArrowLeft", size: 16 }}
            onClick={() => router.back()}
            text="Back to menu"
            variant="ghost"
            className="text-xs p-2 hover:bg-transparent hover:text-brand-color-500"
          />
          {isCombo && (
            <span className="rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
              COMBO
            </span>
          )}
          {isSet && (
            <span className="rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
              SET{product.paxCount ? ` - ${product.paxCount}pax` : ""}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* ── Left: Image ─────────────────────────────────────────────── */}
          <div className="w-full max-w-md md:w-1/2 md:sticky md:top-40 md:self-start">
            <div className="relative aspect-square max-h-96 w-full place-self-center rounded-xl overflow-hidden bg-white">
              <AppImage src={product.image.url} alt={product.name} />
              {!product.isPopular && (
                <div className="absolute top-3 left-3 bg-brand-color-500 text-white text-[10px] font-bold px-3 py-1 rounded-full">
                  Best Seller
                </div>
              )}
              {isOutOfStock && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/10 z-10">
                  <p className="text-red-500 font-bold">Out of stock</p>
                </div>
              )}
            </div>

            {/* Product info / description tabs */}
            <div className="mt-4 border border-gray-200 rounded-lg">
              <div className="flex gap-0 border-b border-gray-200">
                <IconButton
                  onClick={() => setActiveTab("info")}
                  variant={activeTab === "info" ? "primary" : "secondary"}
                  text="Product Info"
                />
                <IconButton
                  onClick={() => setActiveTab("desc")}
                  variant={activeTab === "desc" ? "primary" : "secondary"}
                  text="Description"
                />
              </div>
              <div className="px-4 py-3">
                <p className="text-sm text-gray-500 leading-relaxed">
                  {activeTab === "info"
                    ? product.info || "No product info available."
                    : product.description || "No description available."}
                </p>
              </div>
            </div>
          </div>

          {/* ── Right: Details & Modifier Groups ────────────────────────── */}
          <div className="w-full md:w-1/2 flex flex-col gap-5">
            {/* Header */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">
                {product.category?.name}
              </p>
              <h1 className="text-2xl font-bold text-gray-900">
                {product.name}
              </h1>

              <IconButton
                type="button"
                onClick={() => router.push(`/products/${product._id}/reviews`)}
                variant={"ghost"}
                title={
                  averageRating <= 0 || totalReviews <= 0
                    ? "No reviews yet"
                    : "View reviews of this product"
                }
                disabled={averageRating <= 0 || totalReviews <= 0}
                className="disabled:bg-transparent disabled:hover:bg-transparent py-2 px-0"
                children={
                  <>
                    <StarRatingDisplay rating={averageRating} />
                    <span className="font-semibold text-gray-600">
                      {Number(averageRating).toFixed(1)}
                    </span>
                    <span>· {Number(totalReviews)} reviews</span>
                  </>
                }
              />
              {/* Price */}
              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-2xl font-bold text-brand-color-500">
                  {formatCurrency(displayUnitPrice)}
                </span>
                {hasModifierGroups && upgradeTotal > 0 && (
                  <span className="text-xs text-gray-400">
                    ({formatCurrency(basePrice)} base +{" "}
                    {formatCurrency(upgradeTotal)} upgrades)
                  </span>
                )}
                {!hasModifierGroups && hasProductDiscount && (
                  <>
                    <span className="text-sm text-gray-400 line-through">
                      {formatCurrency(basePrice)}
                    </span>
                    <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-bold text-green-700">
                      {activeProductDiscount!.label}
                    </span>
                  </>
                )}
              </div>

              {isSet && product.paxCount && (
                <p className="text-xs font-semibold text-emerald-600 mt-1">
                  Good for {product.paxCount} pax
                </p>
              )}
            </div>

            {/* ── Modifier Groups ─────────────────────────────────────────── */}
            {hasModifierGroups &&
              populatedGroups.map((group) => {
                const groupId = group._id ?? "";
                const groupQtyMap = modifierQuantities.get(groupId);
                const isRadio = group.maxSelect === 1;

                return (
                  <div
                    key={groupId}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    {/* Group header */}
                    <div className="mb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-gray-900">
                          {group.name}
                        </h3>
                        {group.required && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-color-500">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {isRadio
                          ? "Choose 1"
                          : `Choose up to ${group.maxSelect}`}
                        {group.required &&
                          group.minSelect > 1 &&
                          ` (at least ${group.minSelect})`}
                      </p>
                    </div>

                    {/* Items list */}
                    <div className="space-y-2">
                      {group.items.map((modItem) => {
                        const modProductId = modItem.product._id;
                        const itemQty = groupQtyMap?.get(modProductId) ?? 0;
                        const isSelected = itemQty > 0;
                        const upgradePrice =
                          modItem.price ?? modItem.product.price ?? 0;
                        const soloPrice = modItem.product.price ?? 0;
                        const hasDiscount =
                          modItem.price !== null &&
                          modItem.price !== undefined &&
                          modItem.price < soloPrice;
                        const savings = hasDiscount
                          ? roundMoney(soloPrice - modItem.price!)
                          : 0;

                        return (
                          <div
                            key={modProductId}
                            role="button"
                            tabIndex={isOutOfStock ? -1 : 0}
                            aria-disabled={isOutOfStock}
                            onClick={() =>
                              setModifierItemQty(
                                groupId,
                                modProductId,
                                group.maxSelect,
                                isSelected ? 0 : 1,
                              )
                            }
                            onKeyDown={(e) => {
                              if (isOutOfStock) return;
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setModifierItemQty(
                                  groupId,
                                  modProductId,
                                  group.maxSelect,
                                  isSelected ? 0 : 1,
                                );
                              }
                            }}
                            className={`flex w-full items-center cursor-pointer  gap-3 p-3 rounded-lg border transition-all ${
                              isSelected
                                ? "border-brand-color-500 bg-brand-color-50"
                                : "border-gray-200 bg-white hover:border-gray-300"
                            }`}
                          >
                            {/* Selection indicator + click to toggle */}
                            <div
                              className={`w-5 h-5 flex items-center justify-center rounded-${isRadio ? "full" : "md"} border-2 transition-colors cursor-pointer disabled:cursor-not-allowed ${
                                isSelected
                                  ? "border-brand-color-500 bg-brand-color-500"
                                  : "border-gray-300"
                              }`}
                            >
                              {isSelected && (
                                <DynamicIcon
                                  name="Check"
                                  size={12}
                                  className="text-white"
                                />
                              )}
                            </div>
                            {/* Item info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-start text-gray-900 truncate">
                                {modItem.label ?? modItem.product.name}
                              </p>
                              {modItem.label &&
                                modItem.label !== modItem.product.name && (
                                  <p className="text-[10px] text-gray-400 truncate">
                                    {modItem.product.name}
                                  </p>
                                )}
                            </div>
                            {/* Upgrade price */}
                            <div className="text-right shrink-0">
                              <span className="text-sm font-bold text-brand-color-500">
                                {upgradePrice === 0
                                  ? "0"
                                  : `+ ${formatCurrency(upgradePrice)}`}
                              </span>
                              {hasDiscount && savings > 0 && (
                                <span className="block text-[10px] font-semibold text-green-600">
                                  saves {formatCurrency(savings)}
                                </span>
                              )}
                            </div>
                            {/* Quantity stepper — visible only when selected */}
                            {isSelected && (
                              <div onClick={(e) => e.stopPropagation()} className="max-w-28">
                                <QuantityStepper
                                  value={itemQty}
                                  min={1}
                                  onChange={(val) =>
                                    setModifierItemQty(
                                      groupId,
                                      modProductId,
                                      group.maxSelect,
                                      val,
                                    )
                                  }
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

            {/* ── Validation errors ────────────────────────────────────────── */}
            {modifierValidationErrors.length > 0 && (
              <div className="flex items-start gap-2 text-xs text-red-500 bg-red-50 rounded-lg p-3">
                <DynamicIcon
                  name="AlertCircle"
                  size={14}
                  className="shrink-0 mt-0.5"
                />
                <div>
                  {modifierValidationErrors.map((err, i) => (
                    <p key={i}>{err}</p>
                  ))}
                </div>
              </div>
            )}

            {/* ── Add to cart footer ────────────────────────────────────────── */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 py-4 -mx-4 px-4 md:mx-0 md:px-0 md:border-t-0 md:pt-0">
              <div className="flex items-center gap-3 mt-4">
                <div className="place-self-stretch">
                  <QuantityStepper
                    value={mainQty}
                    min={1}
                    onChange={setMainQty}
                  />
                </div>
                <IconButton
                  text={
                    isAdded
                      ? "Added!"
                      : `Add to cart · ${formatCurrency(total)}`
                  }
                  variant={
                    isAdded
                      ? "success"
                      : canAddToCart && !isOutOfStock
                        ? "primary"
                        : "disabled"
                  }
                  className="p-3 rounded-lg w-full"
                  icon={{ name: isAdded ? "Check" : "ShoppingBag" }}
                  onClick={handleAddToCart}
                  disabled={isAdded || !canAddToCart || isOutOfStock}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Page = () => {
  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      <ProductDetailPage />
    </Suspense>
  );
};

export default Page;
