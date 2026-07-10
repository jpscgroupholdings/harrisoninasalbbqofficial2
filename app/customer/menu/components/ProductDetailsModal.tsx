"use client";

import React, { useState, useMemo } from "react";
import { Check, Minus, Plus, ShoppingBag, AlertCircle } from "lucide-react";
import { multiplyMoney, roundMoney } from "@/lib/money";
import { trackViewContent, trackAddToCart } from "@/lib/metaPixel";
import { BranchProduct } from "@/hooks/api/useBranchProductInfinite";
import { useCart } from "@/contexts/CartContext";
import { ModifierSelection, ModifierSelectionItem } from "@/types/MenuTypes";
import { ModifierGroup, ModifierItem } from "@/types/products";
import Modal from "@/components/ui/Modal";
import { syne } from "@/app/font";
import { OrderItemImage } from "../../components/OrderItemImage";
import StarRatingDisplay from "@/components/ui/StarRating";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Populated modifier item as received from the customer-facing API */
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

interface ProductDetailModalProps {
  item: BranchProduct;
  reviews: {
    totalReviews: number;
    averageRating: number;
  };
  selectedBranch?: string;
  onClose: () => void;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const QuantityStepper = ({
  value,
  onChange,
  min = 0,
}: {
  value: number;
  onChange: (val: number) => void;
  min?: number;
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    // Allow empty while typing
    if (raw === "") {
      onChange(min);
      return;
    }

    const parsed = Number(raw);

    if (isNaN(parsed)) return;

    onChange(Math.max(min, parsed));
  };

  return (
    <div className="flex items-center gap-0 border border-gray-200 rounded-lg overflow-hidden h-full">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
      >
        <Minus size={12} />
      </button>

      <input
        type="number"
        value={value}
        min={min}
        onChange={handleInputChange}
        className="w-10 text-center outline-none"
      />

      <button
        onClick={() => onChange(value + 1)}
        className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
      >
        <Plus size={12} />
      </button>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  item,
  reviews,
  selectedBranch,
  onClose,
}) => {
  const { addToCart } = useCart();

  const [activeTab, setActiveTab] = useState<"info" | "desc">("info");
  const [mainQty, setMainQty] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  // ── Modifier selections state ──────────────────────────────────────────────
  // Map<groupId, Set<productId>> — tracks which items the customer selected per group
  const [modifierSelections, setModifierSelections] = useState<
    Map<string, Set<string>>
  >(new Map());

  // Whether this product is a combo/set with modifier groups
  const hasModifierGroups =
    item.productType !== "solo" && (item.modifierGroups?.length ?? 0) > 0;

  // Cast modifier items to populated type (API returns populated product objects on customer side)
  const populatedGroups: PopulatedModifierGroup[] =
    (item.modifierGroups ?? []) as PopulatedModifierGroup[];

  // ── Computed: upgrade pricing ──────────────────────────────────────────────

  /** Sum of upgrade prices for all currently selected modifier items */
  const upgradeTotal = useMemo(() => {
    if (!hasModifierGroups) return 0;
    let sum = 0;
    for (const group of populatedGroups) {
      const selectedIds = modifierSelections.get(group._id ?? "");
      if (!selectedIds) continue;
      for (const modItem of group.items) {
        if (selectedIds.has(modItem.product._id)) {
          // upgradePrice: admin-set override price, or fall back to the solo product price
          const upgradePrice = modItem.price ?? modItem.product.price ?? 0;
          sum += upgradePrice * modItem.quantity;
        }
      }
    }
    return roundMoney(sum);
  }, [hasModifierGroups, populatedGroups, modifierSelections]);

  const basePrice = item.price ?? 0;
  const activeProductDiscount = item.activeProductDiscount;
  const hasProductDiscount =
    Boolean(activeProductDiscount) && activeProductDiscount!.discountAmount > 0;
  // For combos: unit price = base + all upgrade prices
  // For solos: unit price = discounted or base
  const displayUnitPrice = hasModifierGroups
    ? roundMoney(basePrice + upgradeTotal)
    : hasProductDiscount
      ? activeProductDiscount!.discountedPrice
      : basePrice;
  const total = multiplyMoney(displayUnitPrice, mainQty);

  // ── Modifier validation ──────────────────────────────────────────────────────

  /** Check whether all required groups have at least minSelect items selected */
  const modifierValidationErrors = useMemo(() => {
    if (!hasModifierGroups) return [];
    const errors: string[] = [];
    for (const group of populatedGroups) {
      const selectedIds = modifierSelections.get(group._id ?? "");
      const selectedCount = selectedIds?.size ?? 0;
      if (group.required && selectedCount < group.minSelect) {
        errors.push(
          `${group.name}: select at least ${group.minSelect}`,
        );
      }
    }
    return errors;
  }, [hasModifierGroups, populatedGroups, modifierSelections]);

  const canAddToCart = modifierValidationErrors.length === 0;

  // ── Modifier selection handlers ──────────────────────────────────────────────

  /** Toggle an item in a group — works for both radio (maxSelect=1) and checkbox (maxSelect>1) */
  const toggleModifierItem = (groupId: string, productId: string, maxSelect: number) => {
    setModifierSelections((prev) => {
      const next = new Map(prev);
      const current = next.get(groupId) ?? new Set<string>();

      if (maxSelect === 1) {
        // Radio behavior: selecting one deselects all others
        if (current.has(productId)) {
          // Deselecting the only selection
          next.set(groupId, new Set());
        } else {
          next.set(groupId, new Set([productId]));
        }
      } else {
        // Checkbox behavior
        const updated = new Set(current);
        if (updated.has(productId)) {
          updated.delete(productId);
        } else {
          // Enforce maxSelect: if at limit, don't add more
          if (updated.size >= maxSelect) return prev;
          updated.add(productId);
        }
        next.set(groupId, updated);
      }

      return next;
    });
  };

  // ── Fire ViewContent pixel ────────────────────────────────────────────────

  React.useEffect(() => {
    trackViewContent({
      content_ids: [item._id],
      content_type: "product",
      content_name: item.name,
      content_category: item.category?.name ?? "Menu Item",
      currency: "PHP",
      value: item.price ?? 0,
    });
  }, [item.name, item.category?.name, item.price]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAddToCart = () => {
    if (!canAddToCart) return;

    // Build ModifierSelection[] for combo/set items
    const selections: ModifierSelection[] = hasModifierGroups
      ? populatedGroups
          .map((group) => {
            const selectedIds = modifierSelections.get(group._id ?? "");
            if (!selectedIds || selectedIds.size === 0) return null;
            const items: ModifierSelectionItem[] = group.items
              .filter((modItem) => selectedIds.has(modItem.product._id))
              .map((modItem) => ({
                productId: modItem.product._id,
                name: modItem.product.name,
                label: modItem.label,
                upgradePrice: modItem.price ?? modItem.product.price ?? 0,
                quantity: modItem.quantity,
              }));
            return {
              groupId: group._id ?? "",
              groupName: group.name,
              required: group.required,
              minSelect: group.minSelect,
              maxSelect: group.maxSelect,
              items,
            };
          })
          .filter(Boolean) as ModifierSelection[]
      : [];

    addToCart({
      _id: item._id,
      name: item.name,
      // For combos: price = base + upgrade total (all existing discount logic works on this)
      price: hasModifierGroups ? roundMoney(basePrice + upgradeTotal) : basePrice,
      image: item.image.url,
      activeProductDiscount: hasModifierGroups ? null : activeProductDiscount,
      productType: item.productType,
      modifierSelections: selections,
      category: {
        _id: item.category._id,
        name: item.category.name,
      },
      quantity: mainQty,
    });

    trackAddToCart({
      content_ids: [item._id],
      content_type: "product",
      content_name: item.name,
      content_category: item.category?.name ?? "Menu Item",
      currency: "PHP",
      value: displayUnitPrice,
    });

    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
      onClose();
    }, 1500);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Modal
      onClose={onClose}
      title="Product Details"
      subTitle={hasModifierGroups ? "Customize your order" : "Recommended items to go with this product"}
      contentClassName="p-0"
    >
      <div
        className={`${syne.className} flex flex-col overflow-auto max-h-[75vh]`}
      >
        <div className="flex overflow-hidden">
          {/* scrollable content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-gray-100">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">
                      {item.category?.name}
                    </p>
                    <h2 className="text-xl font-bold text-gray-900">
                      {item.name}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex">
                        <StarRatingDisplay rating={reviews.averageRating} />
                      </div>
                      <span className="text-xs text-gray-400">
                        {Number(reviews.averageRating).toFixed(1)} ·{" "}
                        {Number(reviews.totalReviews)} reviews
                      </span>
                    </div>
                  </div>
                </div>
                {/* Price */}
                <div className="flex items-baseline gap-2 mt-3">
                  <span className="text-2xl font-bold text-brand-color-500">
                    PHP {displayUnitPrice.toFixed(2)}
                  </span>
                  {hasModifierGroups && upgradeTotal > 0 && (
                    <span className="text-xs text-gray-400">
                      (₱{basePrice.toFixed(2)} base + ₱{upgradeTotal.toFixed(2)} upgrades)
                    </span>
                  )}
                  {!hasModifierGroups && hasProductDiscount && (
                    <>
                      <span className="text-sm text-gray-400 line-through">
                        PHP {basePrice.toFixed(2)}
                      </span>
                      <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-bold text-green-700">
                        {activeProductDiscount!.label}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* image */}
              <div className="w-52 min-w-52 hidden sm:flex items-start">
                <div className="relative w-full aspect-square rounded-xl overflow-hidden">
                  <div className="h-full">
                    <OrderItemImage image={item.image.url} name={item.name} />
                  </div>
                  {item.isPopular && (
                    <div className="absolute top-3 left-3 bg-brand-color-500 text-white text-[10px] font-bold px-3 py-1 rounded-full">
                      Best Seller
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">
              {/* Tabs */}
              <div className="px-5 pt-4 pb-3 border-b border-gray-100">
                <div className="flex gap-0 border border-gray-200 rounded-lg overflow-hidden w-fit mb-3">
                  <button
                    onClick={() => setActiveTab("info")}
                    className={`px-4 py-1.5 text-xs transition-colors cursor-pointer ${
                      activeTab === "info"
                        ? "bg-brand-color-500 text-white"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    Product Info
                  </button>
                  <button
                    onClick={() => setActiveTab("desc")}
                    className={`px-4 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                      activeTab === "desc"
                        ? "bg-brand-color-500 text-white"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    Description
                  </button>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {activeTab === "info"
                    ? item.info || "No product info available."
                    : item.description || "No description available."}
                </p>
              </div>

              {/* ── Modifier Groups ──────────────────────────────────────────── */}
              {hasModifierGroups && populatedGroups.map((group) => {
                const groupId = group._id ?? "";
                const selectedIds = modifierSelections.get(groupId);
                const isRadio = group.maxSelect === 1;

                return (
                  <div key={groupId} className="px-5 pt-4 pb-3 border-b border-gray-100">
                    {/* Group header */}
                    <div className="mb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-gray-900">{group.name}</h3>
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
                        {group.required && group.minSelect > 1 && ` (at least ${group.minSelect})`}
                      </p>
                    </div>

                    {/* Items list */}
                    <div className="space-y-2">
                      {group.items.map((modItem) => {
                        const productId = modItem.product._id;
                        const isSelected = selectedIds?.has(productId) ?? false;
                        // Admin-set upgrade price, or fallback to solo price
                        const upgradePrice = modItem.price ?? modItem.product.price ?? 0;
                        const soloPrice = modItem.product.price ?? 0;
                        const hasDiscount = modItem.price !== null && modItem.price !== undefined && modItem.price < soloPrice;
                        const savings = hasDiscount ? roundMoney(soloPrice - modItem.price!) : 0;

                        return (
                          <button
                            key={productId}
                            onClick={() => toggleModifierItem(groupId, productId, group.maxSelect)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                              isSelected
                                ? "border-brand-color-500 bg-brand-color-50"
                                : "border-gray-200 bg-white hover:border-gray-300"
                            }`}
                          >
                            {/* Selection indicator */}
                            <div className={`w-5 h-5 flex items-center justify-center rounded-${isRadio ? "full" : "md"} border-2 transition-colors ${
                              isSelected
                                ? "border-brand-color-500 bg-brand-color-500"
                                : "border-gray-300"
                            }`}>
                              {isSelected && <Check size={12} className="text-white" />}
                            </div>

                            {/* Item thumbnail */}
                            {modItem.product.image?.url && (
                              <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                                <img
                                  src={modItem.product.image.url}
                                  alt={modItem.product.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}

                            {/* Item info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {modItem.label ?? modItem.product.name}
                              </p>
                              {modItem.label && modItem.label !== modItem.product.name && (
                                <p className="text-[10px] text-gray-400 truncate">
                                  {modItem.product.name}
                                </p>
                              )}
                            </div>

                            {/* Upgrade price */}
                            <div className="text-right flex-shrink-0">
                              <span className="text-sm font-bold text-brand-color-500">
                                +₱{upgradePrice.toFixed(2)}
                              </span>
                              {hasDiscount && savings > 0 && (
                                <span className="block text-[10px] font-semibold text-green-600">
                                  saves ₱{savings.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Footer — Add to cart */}
            <div className="px-5 py-4 border-t border-gray-100 bg-white">
              {/* Validation errors */}
              {modifierValidationErrors.length > 0 && (
                <div className="mb-3 flex items-start gap-2 text-xs text-red-500 bg-red-50 rounded-lg p-2">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                  <div>
                    {modifierValidationErrors.map((err, i) => (
                      <p key={i}>{err}</p>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <QuantityStepper value={mainQty} min={1} onChange={setMainQty} />
                <button
                  onClick={() => handleAddToCart()}
                  disabled={isAdded || !canAddToCart}
                  className={`flex-1 py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    isAdded
                      ? "bg-green-500 text-white cursor-default"
                      : canAddToCart
                        ? "bg-brand-color-500 hover:bg-brand-color-600 text-white cursor-pointer"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check size={16} />
                      Added!
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={16} />
                      Add to cart · ₱{total}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ProductDetailModal;
