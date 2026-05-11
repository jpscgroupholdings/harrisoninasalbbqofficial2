"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import OrderDetailsModal from "@/components/OrderDetailsModal";

export default function OrderModal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  return (
    <Modal onClose={() => router.back()} title="Order Details">
      <OrderDetailsModal orderId={id} role="admin" variant="modal"/>
    </Modal>
  );
}