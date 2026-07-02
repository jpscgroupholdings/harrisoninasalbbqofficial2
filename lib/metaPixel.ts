/**
 * Meta Pixel (Facebook Pixel) event tracking utility.
 *
 * The fbq snippet in app/layout.tsx is a raw inline <script> so it
 * executes *before* React hydration — window.fbq is guaranteed to
 * exist when client-component effects fire.
 *
 * As an extra safety net, the wrapper below queues any call made
 * before the snippet ran and flushes them once fbq appears on window.
 */

// ─── Global fbq type declaration ─────────────────────────────────────────────

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: (...args: unknown[]) => void;
  }
}

// ─── Internal event queue (flushed once fbq lands on window) ─────────────────

type QueuedCall = ["track" | "trackCustom", string, object?];

const pendingQueue: QueuedCall[] = [];

/** Flush every queued call through the real fbq function. */
function flushQueue() {
  while (pendingQueue.length) {
    const [track, event, params] = pendingQueue.shift()!;
    if (params) {
      window.fbq!(track, event, params);
    } else {
      window.fbq!(track, event);
    }
  }
}

// ─── Safe fbq caller ─────────────────────────────────────────────────────────

/**
 * Calls fbq() — if the function is on window already, fires immediately
 * (and flushes any earlier queued calls).  If not, queues the call so
 * it's sent once the snippet executes.
 */
function fbq(track: "track" | "trackCustom", event: string, params?: object) {
  if (typeof window === "undefined") return;

  if (window.fbq) {
    flushQueue();
    if (params) {
      window.fbq(track, event, params);
    } else {
      window.fbq(track, event);
    }
  } else {
    const call: QueuedCall = params
      ? [track, event, params]
      : [track, event];
    pendingQueue.push(call);
  }
}

// ─── Standard e-commerce events ──────────────────────────────────────────────

export interface ViewContentParams {
  content_ids?: string[];
  content_type?: "product";
  content_name: string;
  content_category: string;
  currency: "PHP";
  value: number;
}

/** Fires when a user views a product/content page. */
export function trackViewContent(params: ViewContentParams) {
  fbq("track", "ViewContent", params);
}

export interface AddToCartParams {
  content_ids?: string[];
  content_type?: "product";
  content_name: string;
  content_category: string;
  currency: "PHP";
  value: number;
}

/** Fires when a user adds a product to the shopping cart. */
export function trackAddToCart(params: AddToCartParams) {
  fbq("track", "AddToCart", params);
}

export interface AddPaymentInfoParams {
  content_category: string;
  currency: "PHP";
  value: number;
}

/** Fires when a user adds payment info during checkout (e.g. selecting payment method). */
export function trackAddPaymentInfo(params: AddPaymentInfoParams) {
  fbq("track", "AddPaymentInfo", params);
}

export interface InitiateCheckoutParams {
  content_ids?: string[];
  content_type?: "product";
  content_category: string;
  currency: "PHP";
  num_items: number;
  value: number;
}

/** Fires when a user enters the checkout flow. */
export function trackInitiateCheckout(params: InitiateCheckoutParams) {
  fbq("track", "InitiateCheckout", params);
}

export interface PurchaseParams {
  content_ids?: string[];
  content_type?: "product";
  currency: "PHP";
  value: number;
  order_id: string;
}

/** Fires on successful payment completion. */
export function trackPurchase(params: PurchaseParams) {
  fbq("track", "Purchase", params);
}

// ─── Registration & lead events ──────────────────────────────────────────────

export interface CompleteRegistrationParams {
  status: string;
}

/** Fires when a customer completes signup / account registration. */
export function trackCompleteRegistration(params?: CompleteRegistrationParams) {
  fbq("track", "CompleteRegistration", params);
}

export interface LeadParams {
  content_name: string;
  content_category: string;
  currency: "PHP";
  value: number;
}

/** Fires when a user submits a catering inquiry form (potential business lead). */
export function trackLead(params: LeadParams) {
  fbq("track", "Lead", params);
}

// ─── Search & contact events ─────────────────────────────────────────────────

export interface SearchParams {
  search_string: string;
}

/** Fires when a user searches for products on the menu. */
export function trackSearch(params: SearchParams) {
  fbq("track", "Search", params);
}

/** Fires when a customer submits the contact form. */
export function trackContact() {
  fbq("track", "Contact");
}