import { useEffect, useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  Loader,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import Modal from "@/components/ui/Modal";
import OrderNowButton from "@/components/ui/OrderNowButton";
import { useCart } from "@/contexts/CartContext";
import { useCreateOrder } from "@/hooks/api/useOrders";
import { useRouter } from "next/navigation";
import { toast } from "sonner";


const OrderSummaryStep = () => {
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    subTotal,
    tax,
    totalPrice,
    clearCart,
  } = useCart();
  const { mutateAsync: createOrder, isPending } = useCreateOrder();
  const router = useRouter();
  const [checkoutUrl, setCheckoutUrl] = useState<string>("");
  const [placedTotalPrice, setPlaceTotalPrice] = useState(0);

  if (cartItems.length === 0 && !checkoutUrl) {
    return (
      <div className="text-center p-12">
        <ShoppingBag size={64} className="mx-auto text-gray-200 mb-4" />
        <h3 className="text-xl font-semibold text-gray-400 mb-2">
          Your cart is empty
        </h3>
        <p className="text-gray-400">Add your favourite before checking out!</p>
        <OrderNowButton />
      </div>
    );
  }

  const handlePlaceOrder = async () => {
    const MINIMUM_AMOUNT = 100;

    if (totalPrice < MINIMUM_AMOUNT) {
      toast.warning("Minimum Order Amount", {
        description: `The minimum amount for online payment is ₱${MINIMUM_AMOUNT.toFixed(2)}.`,
        duration: 6000,
      });
      return;
    }

    try {
      const data = await createOrder({
        items: cartItems,
        subTotal: totalPrice,
      });

      if (!data.redirectUrl) {
        throw new Error(
          "Payment link was not generated. Please try again or contact support.",
        );
      }

      setCheckoutUrl(data.redirectUrl);
      setPlaceTotalPrice(totalPrice);
      clearCart();
    } catch (error: any) {
      toast.error("Order Failed", {
        description: error.message
      })
    }
  };

  const handleModalClose = () => {
    setCheckoutUrl("");
    router.push("/orders");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Order Summary</h2>
        <p className="text-gray-500">Review your items before proceeding.</p>
      </div>

      {!checkoutUrl && (
        <>
          {/* Cart Items */}
          <div className="space-y-4 max-h-[calc(100vh/2)] overflow-y-auto hide-scrollbar">
            {cartItems.map((item) => (
              <div
                key={item._id}
                className="flex gap-4 bg-linear-to-br from-stone-100 via-amber-50 to-stone-100/50 rounded-xl p-4"
              >
                <img
                  src={item.image}
                  alt={item.name || "Product Image"}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {item.name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {item.category?.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {item.description}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item._id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2 bg-white rounded-full border border-gray-200">
                      <button
                        onClick={() =>
                          updateQuantity(item._id, item.quantity - 1)
                        }
                        className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="font-semibold text-sm w-6 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item._id, item.quantity + 1)
                        }
                        className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <span className="font-bold text-brand-color-500">
                      ₱{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Totals */}
          <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span>₱{subTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>VAT (12%)</span>
              <span>₱{tax.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between">
              <span className="font-bold text-gray-900">Total</span>
              <span className="font-bold text-xl text-brand-color-500">
                ₱{totalPrice.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <button
              onClick={handlePlaceOrder}
              disabled={isPending}
              className={`flex-1 text-white py-3 rounded-full font-bold transition-colors ${isPending ? "cursor-not-allowed bg-gray-400" : "cursor-pointer bg-brand-color-500/90 hover:bg-[#c13500]"}`}
            >
              {!isPending ? (
                "Place Order"
              ) : (
                <span className="flex items-center gap-4 justify-center">
                  Placing Order... <Loader size={16} className="animate-spin" />
                </span>
              )}
            </button>
            <Link
              href={"/menu"}
              className="flex-1 text-gray-700 hover:text-gray-800 text-center py-4 rounded-xl font-semibold transition-colors cursor-pointer underline"
            >
              Need More?
            </Link>
          </div>
        </>
      )}

      {checkoutUrl && (
        <Modal title="" onClose={handleModalClose}>
          <div className="flex flex-col items-center text-center gap-5 py-4">
            {/* Animated check */}
            <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-green-50 ring-8 ring-green-50/50">
              <div className="absolute inset-0 rounded-full bg-green-200 animate-ping opacity-50" />
              <CheckCircle2
                size={88}
                className="text-green-500 relative z-10"
              />
            </div>

            {/* Text */}
            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-gray-900">Order Placed!</h3>
              <p className="text-sm text-gray-400 max-w-220px leading-relaxed">
                Complete your payment to confirm and prepare your order.
              </p>
            </div>

            {/* Total pill */}
            <div className="bg-stone-50 border border-stone-100 rounded-full px-5 py-2 flex items-center gap-2">
              <span className="text-xs text-stone-600 font-medium">
                Amount due
              </span>
              <span className="text-base font-bold text-brand-color-500">
                ₱{placedTotalPrice.toFixed(2)}
              </span>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 w-full pt-1">
              <a
                href={checkoutUrl}
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-brand-color-500 hover:bg-[#c13500] active:scale-[0.98] text-white py-4 rounded-xl font-bold text-base shadow-md shadow-brand-color-500/30 transition-all"
              >
                Pay Now <ExternalLink size={15} />
              </a>
              <button
                onClick={handleModalClose}
                className="mx-auto text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer py-1"
              >
                I'll pay later
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default OrderSummaryStep;
