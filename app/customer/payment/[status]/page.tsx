import PaymentStatusPage, {
  PaymentStatusType,
} from "@/components/PaymentStatusPage";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models/Orders";
import { notFound } from "next/navigation";
import React from "react";

export type Props = {
  params: Promise<{ status: PaymentStatusType }>;
  searchParams: Promise<{ referenceNumber: string }>;
};
const VALID_STATUSES: PaymentStatusType[] = ["success", "failed", "cancel"];

const PaymentStatus = async ({ params, searchParams }: Props) => {
  const { status } = await params;
  const { referenceNumber } = await searchParams;

  if (!VALID_STATUSES.includes(status)) {
    notFound();
  }

  await connectDB();
  const order = await Order.findOne({
    "paymentInfo.referenceNumber": referenceNumber,
  });

  if (status !== "cancel" && !order) notFound();

  // Pass order total and reference number for Meta Pixel Purchase tracking
  const orderValue = order?.total?.totalAmount ?? 0;
  const orderId = referenceNumber ?? order?._id?.toString() ?? "";
  const contentIds = order?.items?.map((item: any) => item.productId?.toString()) ?? [];

  return (
    <PaymentStatusPage
      type={status}
      orderValue={orderValue}
      orderId={orderId}
      contentIds={contentIds}
    />
  );
};

export default PaymentStatus;
