import OrderDetailsModal from "@/components/OrderDetailsModal";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <OrderDetailsModal orderId={id} role="admin" variant="page"/>;
}
