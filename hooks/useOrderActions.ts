// hooks/useOrderActions.ts
import { useCart } from "@/contexts/CartContext";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCancelOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) =>
      apiClient.patch(`/customer/orders/${orderId}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order cancelled successfully");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
};

export function useOrderActions() {
  const { mutate: cancelOrder, isPending } = useCancelOrder();
  const { addToCart, setIsCartOpen } = useCart();
  const [isLoading, setIsLoading] = useState(false);

  const handlePayOrder = async (id: string) => {
    try {
      setIsLoading(true);
      // ── Maya Payment Flow Toggle (retry payment for pending orders) ──
      // ?useQrPh=true  → QR PH only (direct QR code). Uses MAYA_QR_PUBLIC_KEY + /payments/v1/qr/payments
      // remove param   → Full payment page (card, QR, bank, etc.). Uses MAYA_PUBLIC_KEY + /checkout/v1/checkouts
      const response = await apiClient.post<{ redirectUrl: string }>(
        `/paymaya/checkout/${id}?useQrPh=true`,
      );
      window.location.href = response.redirectUrl;
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error("Payment Failed", { description: error.message });
      setIsLoading(false); // only reset on error - onsucess will redirect anyway
    }
  };

  const handleCancelOrder = (orderId: string) => {
    cancelOrder(orderId);
  };

  const handleBuyAgain = (orderItems: any[]) => {
    orderItems.forEach((item) => {
      addToCart({
        _id: item.productId,
        name: item.name,
        price: item.price,
        image: item.image,
        description: item.description,
        category: item.category,
        quantity: 1,
      });
    });
    setIsCartOpen(true);
    console.log(orderItems);
  };

  return {
    handlePayOrder,
    handleCancelOrder,
    handleBuyAgain,
    isLoading,
  };
}
