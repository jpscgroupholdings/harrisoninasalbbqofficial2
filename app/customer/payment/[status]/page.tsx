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

  return <PaymentStatusPage type={status} />;
};

export default PaymentStatus;
