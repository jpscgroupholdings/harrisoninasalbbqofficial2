"use client";

import { authClient } from "@/lib/auth-client";
import {
  calculatePromoCardDiscount,
  calculatePromoCardTotal,
} from "@/lib/promoCard";
import {
  clampMoneyMin,
  minMoney,
  multiplyMoney,
  roundMoney,
  subtractMoney,
} from "@/lib/money";
import { CartItem } from "@/types/MenuTypes";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { apiClient } from "@/lib/apiClient";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (cartKey: string) => void;
  updateQuantity: (cartKey: string, quantity: number) => void;
  clearCart: () => Promise<void>;
  getCartKey: (item: CartItem) => string;
  totalProducts: number;
  totalItems: number;
  vatableSales: number;
  vatAmount: number;
  subtotalPrice: number;
  productDiscountAmount: number;
  productDiscountedSubtotal: number;
  promoCardDiscount: number;
  totalPrice: number;
  applyPromoCardDiscount: boolean;
  setApplyPromoCardDiscount: (apply: boolean) => void;
  setPromoCardDiscountRate: (discountRate: number) => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isSyncing: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LOCALSTORAGE_KEY = "cart_guest";
const DEBOUNCE_MS = 800;

// ─── Utility ──────────────────────────────────────────────────────────────────

/**
 * Generate a composite cart key that distinguishes combo/set items
 * with different modifier selections from each other.
 * Solo items just use their _id; combo items append a hash of their selections.
 */
export function getCartKey(item: CartItem): string {
  if (!item.modifierSelections || item.modifierSelections.length === 0) {
    return item._id;
  }
  const selKey = item.modifierSelections
    .map((g) =>
      g.items
        .map((i) => `${i.productId}:${i.quantity}:${i.upgradePrice}`)
        .sort()
        .join(","),
    )
    .sort()
    .join("|");
  return `${item._id}__${selKey}`;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const CartContext = createContext<CartContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

/**
 * CartProvider
 *
 * Strategy:
 * - Authenticated users  → DB is source of truth. Loads from DB on mount,
 *                          syncs to DB (debounced) on every change.
 *                          localStorage is NOT used.
 * - Guest users          → localStorage is source of truth.
 *
 * Optimistic updates: state is mutated instantly; DB sync is fire-and-forget
 * with a debounce so rapid clicks produce only one network request.
 *
 * On login: call mergeGuestCartOnLogin() once after session is established.
 *
 * @param session - pass the authenticated user's id (or null/undefined for guests)
 */
export const CartProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [applyPromoCardDiscount, setApplyPromoCardDiscount] = useState(false);
  const [promoCardDiscountRate, setPromoCardDiscountRate] = useState(0.3);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const { data: session } = authClient.useSession();

  // Holds the pending debounce timer for DB sync
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tracks the last items array that was successfully synced to DB
  const lastSyncedRef = useRef<CartItem[]>([]);
  // Tracks whether we're currently authenticated
  const isAuthenticated = Boolean(session?.user);

  // ─── Mount: load initial cart ───────────────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      if (isAuthenticated) {
        // Authenticated: fetch from DB, ignore localStorage
        try {
          const cartData = await apiClient.get<{ items: CartItem[] }>(
            "/customer/cart",
          );
          const items: CartItem[] = cartData.items ?? [];
          setCartItems(items);
          lastSyncedRef.current = items;

          localStorage.removeItem(LOCALSTORAGE_KEY);
        } catch (err) {
          console.error("[CartContext] Failed to load cart from DB:", err);
        }
      } else {
        // Guest: load from localStorage
        try {
          const raw = localStorage.getItem(LOCALSTORAGE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) setCartItems(parsed);
          }
        } catch (err) {
          console.error("[CartContext] Failed to load guest cart:", err);
        }
      }
      setIsHydrated(true);
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user]); // re-run when userId changes (e.g. login / logout)

  // ─── Sync: persist cart whenever it changes ─────────────────────────────────

  useEffect(() => {
    if (!isHydrated) return;

    if (isAuthenticated) {
      // Debounced DB sync — replaces the entire cart in one PUT
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      syncTimerRef.current = setTimeout(() => {
        syncToDb(cartItems);
      }, DEBOUNCE_MS);
    } else {
      // Guest: immediately persist to localStorage
      try {
        localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(cartItems));
      } catch (err) {
        console.error("[CartContext] Failed to save guest cart:", err);
      }
    }

    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems, isHydrated, isAuthenticated]);

  // ─── DB sync helper ─────────────────────────────────────────────────────────

  const syncToDb = useCallback(async (items: CartItem[]) => {
    // Skip if nothing actually changed
    if (JSON.stringify(items) === JSON.stringify(lastSyncedRef.current)) return;

    setIsSyncing(true);
    try {
      await apiClient.put("/customer/cart", {
        items,
      });

      lastSyncedRef.current = items;
    } catch (err) {
      console.error("[CartContext] Failed to sync cart to DB:", err);
      // Optionally: surface a toast notification here
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // ─── Cart actions (always optimistic) ───────────────────────────────────────

  const addToCart = useCallback((item: CartItem) => {
    setCartItems((prev) => {
      const itemKey = getCartKey(item);
      const existing = prev.find((c) => getCartKey(c) === itemKey);
      if (existing) {
        return prev.map((c) =>
          getCartKey(c) === itemKey
            ? {
                ...c,
                activeProductDiscount: item.activeProductDiscount ?? null,
                quantity: c.quantity + item.quantity,
              }
            : c,
        );
      }
      return [...prev, { ...item }];
    });
  }, []);

  /** Remove a cart item by its composite cart key (not just _id) */
  const removeFromCart = useCallback((cartKey: string) => {
    setCartItems((prev) => prev.filter((item) => getCartKey(item) !== cartKey));
  }, []);

  /** Update quantity for a specific cart entry by its composite cart key */
  const updateQuantity = useCallback(
    (cartKey: string, quantity: number) => {
      if (quantity <= 0) {
        removeFromCart(cartKey);
        return;
      }
      setCartItems((prev) =>
        prev.map((item) =>
          getCartKey(item) === cartKey ? { ...item, quantity } : item,
        ),
      );
    },
    [removeFromCart],
  );

  const clearCart = useCallback(async () => {
    setCartItems([]);
    setApplyPromoCardDiscount(false);

    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);

    if (isAuthenticated) {
      lastSyncedRef.current = cartItems; // ensure guard doesn't skip it
      await syncToDb([]);
    } else {
      localStorage.removeItem(LOCALSTORAGE_KEY);
    }
  }, [syncToDb, cartItems, isAuthenticated]);

  // ─── Derived values ──────────────────────────────────────────────────────────

  const totalProducts = cartItems.length;
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalPrice = cartItems.reduce(
    (sum, item) => sum + multiplyMoney(item.price, item.quantity),
    0,
  );
  const productDiscountAmount = roundMoney(
    cartItems.reduce((sum, item) => {
      const unitDiscount = item.activeProductDiscount?.discountAmount ?? 0;
      const lineSubtotal = multiplyMoney(item.price, item.quantity);
      return (
        sum + minMoney(multiplyMoney(unitDiscount, item.quantity), lineSubtotal)
      );
    }, 0),
  );
  const productDiscountedSubtotal = clampMoneyMin(
    subtotalPrice - productDiscountAmount,
  );
  const promoCardDiscount = applyPromoCardDiscount
    ? calculatePromoCardDiscount(
        productDiscountedSubtotal,
        promoCardDiscountRate,
      )
    : 0;
  const totalPrice = applyPromoCardDiscount
    ? calculatePromoCardTotal(productDiscountedSubtotal, promoCardDiscountRate)
    : productDiscountedSubtotal;
  // VAT-inclusive: vatableSales = totalPrice / 1.12, using centavo arithmetic
  const vatableSales = multiplyMoney(totalPrice, 1 / 1.12);
  const vatAmount = subtractMoney(totalPrice, vatableSales);

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartKey,
        totalProducts,
        totalItems,
        vatableSales,
        vatAmount,
        subtotalPrice,
        productDiscountAmount,
        productDiscountedSubtotal,
        promoCardDiscount,
        totalPrice,
        applyPromoCardDiscount,
        setApplyPromoCardDiscount,
        setPromoCardDiscountRate,
        isCartOpen,
        setIsCartOpen,
        isSyncing,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// ─── Hook ──────────────────────────────────────────────────────────────────────

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};

// ─── Guest cart merge utility ─────────────────────────────────────────────────

/**
 * Call this once after a user logs in to merge their guest cart into their
 * DB cart. Clears localStorage afterward so the guest cart isn't re-applied.
 *
 * Usage:
 *   await mergeGuestCartOnLogin();
 *   // then re-mount CartProvider with the userId so it fetches the merged cart
 */
export async function mergeGuestCartOnLogin(): Promise<void> {
  try {
    const raw = localStorage.getItem(LOCALSTORAGE_KEY);
    if (!raw) return;

    const guestItems: CartItem[] = JSON.parse(raw);
    if (!Array.isArray(guestItems) || guestItems.length === 0) return;
    await apiClient.post("/customer/cart/merge", { guestItems });

    localStorage.removeItem(LOCALSTORAGE_KEY);
  } catch (err) {
    console.error("[CartContext] Failed to merge guest cart on login:", err);
  }
}
