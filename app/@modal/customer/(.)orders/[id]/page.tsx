import Modal from '@/components/Modal';
import OrderDetails from '@/app/customer/orders/OrderDetails';

export default async function OrderModal({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  
  return (
    <Modal>
      <OrderDetails orderId={id} variant="modal" />
    </Modal>
  );
}