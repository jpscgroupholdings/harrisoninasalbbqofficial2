"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import OrderDetails from "@/app/customer/orders/OrderDetails";
import Modal from "@/components/ui/Modal";

export default function OrderModal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  return (
    <Modal onClose={() => router.back()} title="Order Details">
      <OrderDetails orderId={id} variant="modal" />
    </Modal>
  );
}