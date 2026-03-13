import PaymentStatusPage, {
  PaymentStatusType,
} from "@/components/PaymentStatusPage";
import { notFound } from "next/navigation";
import React from "react";

export type Props = {
  params: Promise<{ status: PaymentStatusType }>;
};
const VALID_STATUSES: PaymentStatusType[] = ["success", "failed", "cancel"];

const PaymentStatus = async ({ params }: Props) => {
  const { status } = await params;

  if (!VALID_STATUSES.includes(status)) {
    notFound();
  }

  return <PaymentStatusPage type={status} />;
};

export default PaymentStatus;
