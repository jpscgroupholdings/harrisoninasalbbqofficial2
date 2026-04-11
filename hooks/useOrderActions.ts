// hooks/useOrderActions.ts
import { useCart } from "@/contexts/CartContext";
import { useUpdateOrder } from "./api/useOrders";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";
import { useState } from "react";

export function useOrderActions() {
  const updateOrder = useUpdateOrder();
  const { addToCart, setIsCartOpen } = useCart();
  const [isLoading, setIsLoading] = useState(false);

  const handlePayOrder = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await apiClient.post<{ redirectUrl: string }>(
        `/paymaya/checkout/${id}`,
      );
      window.location.href = response.redirectUrl;
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error("Payment Failed", { description: error.message });
      setIsLoading(false); // only reset on error - onsucess will redirect anyway
    }
  };

  const handleCancelOrder = (orderId: string) => {
    if (!confirm(`Are you sure you want to cancel order ${orderId}?`)) return;

    setIsLoading(true);
    updateOrder.mutate(
      { id: orderId, data: { status: "cancelled" } },
      {
        onSuccess: () => toast.success("Order cancelled!"),
        onSettled: () => setIsLoading(false),
      },
    );
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
