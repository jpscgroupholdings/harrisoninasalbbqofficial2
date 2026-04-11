// hooks/useOrderActions.ts
import { useCart } from "@/contexts/CartContext";
import { useUpdateOrder } from "./api/useOrders";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";

export function useOrderActions() {
  const updateOrder = useUpdateOrder();
  const { addToCart, setIsCartOpen } = useCart();

  const handlePayOrder = async (id: string) => {
    try {
      const response = await apiClient.post<{ redirectUrl: string }>(
        `/paymaya/checkout/${id}`,
      );
      window.location.href = response.redirectUrl;
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error("Payment Failed", { description: error.message });
    }
  };

  const handleCancelOrder = (orderId: string) => {
    if (confirm(`Are you sure you want to cancel order ${orderId}?`)) {
      updateOrder.mutate(
        { id: orderId, data: { status: "cancelled" } },
        { onSuccess: () => toast.success("Order cancelled!") },
      );
    }
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
    console.log(orderItems)
  };

  return { handlePayOrder, handleCancelOrder, handleBuyAgain };
}