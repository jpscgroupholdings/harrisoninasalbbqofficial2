import {
  Head,
  Html,
  Preview,
  Tailwind,
  Text,
  Section,
  Row,
  Column,
  Hr,
  Link,
  Img,
} from "@react-email/components";
import React from "react";
import { OrderType } from "@/types/OrderTypes";
import { OrderStatus } from "@/types/orderConstants";
import StatusBadge from "@/components/ui/StatusBadge";

interface OrderSummaryEmailProps {
  order: OrderType;
}

const formatCurrency = (amount: number) =>
  `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

/* ── Status-aware copy ── */
function getStatusCopy(status: OrderStatus) {
  switch (status) {
    case "paid":
      return {
        preview: "Payment received — your order is confirmed!",
        heading: "Payment confirmed",
        message: "Your payment has been received and your order is confirmed. We will begin processing it shortly.",
      };
    case "preparing":
      return {
        preview: "Your order is now being prepared.",
        heading: "Your order is being prepared",
        message: "Your order is currently being prepared. We will notify you once it is ready.",
      };
    case "ready":
      return {
        preview: "Your order is ready.",
        heading: "Your order is ready",
        message: "Your order has been completed and is ready. Please expect it to be served or delivered shortly.",
      };
    case "cancelled":
      return {
        preview: "Your order has been cancelled.",
        heading: "Order cancelled",
        message: "Your order has been cancelled. If you did not request this or have any concerns, please do not hesitate to contact us.",
      };
    case "failed":
      return {
        preview: "Your order could not be completed.",
        heading: "Order unsuccessful",
        message: "We were unable to process your order. Please try again or contact us if the issue continues.",
      };
    case "expired":
      return {
        preview: "Your order has expired.",
        heading: "Order expired",
        message: "Your order was not completed within the allotted time and has expired. You may place a new order at any time.",
      };
    default:
      return {
        preview: "An update regarding your order.",
        heading: "Order update",
        message: "There has been an update to your order. Please contact us if you have any questions or concerns.",
      };
  }
}

/* ── mock ── */
const mockOrder: OrderType = {
  _id: "64a3f2b81c9e4d0012ab81c9",
  createdAt: "2026-04-15T10:32:00.000Z",
  status: "ready",
  branchSnapshot: {
    name: "Century Mall",
    code: "BR-001",
    address: "Makati City",
    contactNumber: "096339749837",
  },
  estimatedTime: "25–35 minutes",
  notes: "Please make the sisig extra spicy. No sawsawan needed.",
  items: [
    { _id: "p001", name: "Grilled Pork Sisig", price: 215, quantity: 2, image: "" },
    { _id: "p002", name: "Crispy Pata", price: 680, quantity: 1, image: "" },
    { _id: "p003", name: "Java Rice ×3", price: 45, quantity: 3, image: "" },
    { _id: "p004", name: "Mango Shake", price: 110, quantity: 2, image: "" },
  ],
  paymentInfo: {
    method: { type: "paymaya", description: "***** ***0900", scheme: "Visa", last4: "4242" },
    referenceNumber: "TXN-20260415-0081",
    paymentStatus: "paid",
    paidAt: new Date("2026-04-15T10:31:45.000Z"),
    customerName: "Maria Santos",
    customerEmail: "maria.santos@gmail.com",
    customerPhone: "+63 917 555 0123",
  },
  total: { vatableSales: 1465.0, vatAmount: 175.8, totalAmount: 1640.8 },
};

const publicUrl =
  process.env.NEXT_PUBLIC_URL ?? "https://harrisoninasalbbq.com.ph";

const OrderSummaryEmail = ({ order = mockOrder }: OrderSummaryEmailProps) => {
  const {
    paymentInfo,
    items,
    total,
    status,
    estimatedTime,
    notes,
    branchSnapshot,
  } = order;

  const statusCopy = getStatusCopy(status);
  const firstName = paymentInfo.customerName.split(" ")[0];

  return (
    <Tailwind>
      <Html>
        <Head />
        <Preview>
          Order #{paymentInfo?.referenceNumber ?? ""} — {statusCopy.preview}
        </Preview>

        {/* Page bg */}
        <Section className="bg-white py-8 px-4">
          <Section className="max-w-150 mx-auto bg-white rounded-xl border border-gray-100">
            {/* ── Header ── */}
            <Section className="px-8 py-7 border-b border-gray-100 text-center">
              <Img
                src={`${publicUrl}/images/harrison_logo_landscape.png`}
                width="200"
                alt="Harrison Logo"
                className="mx-auto mb-3"
              />
              <Text className="inline-block text-xs uppercase tracking-widest text-black border-b border-[#ef4501] pb-0.5 mb-2">
                {statusCopy.heading}
              </Text>
              <Text className="text-sm text-gray-600 m-0">
                Hi{" "}
                <span className="font-medium text-black">{firstName}</span>
                {" — "}
                {statusCopy.message}
              </Text>
            </Section>

            {/* ── Status + Order ID ── */}
            <Section className="px-8 py-4 border-b border-gray-100">
              <Row>
                <Column>
                  <Text className="text-[11px] uppercase tracking-[0.04em] text-gray-600 mb-2">
                    Order status
                  </Text>
                  <StatusBadge status={status} />
                </Column>
                <Column className="text-right">
                  <Text className="text-[11px] uppercase tracking-[0.04em] text-gray-600 mb-1">
                    Order ID
                  </Text>
                  <Text className="text-sm font-medium m-0 text-black">
                    #{paymentInfo.referenceNumber?.toUpperCase()}
                  </Text>
                </Column>
              </Row>
            </Section>

            {/* ── Branch Details ── */}
            <Section className="px-8 py-4 border-b border-gray-100">
              <Text className="text-[11px] uppercase tracking-[0.04em] text-black font-bold">
                Branch details
              </Text>
              <Row>
                <Column>
                  <Text className="text-sm font-medium text-black mb-0.5">
                    {branchSnapshot?.name}
                  </Text>
                  <Text className="text-sm text-gray-500 m-0">
                    Branch code: {branchSnapshot?.code}
                  </Text>
                  <Text className="text-sm text-gray-500 m-0">
                    {branchSnapshot?.address}
                  </Text>
                </Column>
                <Column className="text-right">
                  <Text className="text-sm text-gray-500 m-0">
                    {branchSnapshot?.contactNumber}
                  </Text>
                  <Text className="text-sm text-gray-500 mt-1 m-0">
                    Est. {estimatedTime}
                  </Text>
                </Column>
              </Row>
            </Section>

            {/* ── Customer + Payment ── */}
            <Section className="px-8 py-4 border-b border-gray-100">
              <Row>
                <Column className="pr-4">
                  <Text className="text-[11px] uppercase tracking-[0.04em] text-black font-bold mb-1">
                    Customer
                  </Text>
                  <Text className="text-sm font-medium text-black mb-0.5">
                    {paymentInfo.customerName}
                  </Text>
                  <Text className="text-sm text-gray-500 mb-0.5">
                    {paymentInfo.customerEmail}
                  </Text>
                  <Text className="text-sm text-gray-500 m-0">
                    {paymentInfo.customerPhone}
                  </Text>
                </Column>
                <Column>
                  <Text className="text-[11px] uppercase tracking-[0.04em] text-black font-bold mb-1">
                    Payment
                  </Text>
                  <Text className="text-sm font-medium uppercase text-black mb-0.5">
                    {paymentInfo.method.type ?? "N/A"}
                  </Text>
                  <Text className="text-sm font-medium text-black mb-0.5">
                    {paymentInfo.method.description}
                  </Text>
                </Column>
              </Row>
            </Section>

            {/* ── Items table ── */}
            <Section className="px-8 pt-4">
              <Text className="text-[11px] uppercase tracking-[0.04em] text-black font-bold mb-2.5">
                Order items
              </Text>
              <Row className="border-b border-gray-100 pb-1.5">
                <Column>
                  <Text className="text-xs text-gray-600 font-medium m-0">Item</Text>
                </Column>
                <Column className="w-12.5 text-center">
                  <Text className="text-xs text-gray-600 font-medium m-0">Qty</Text>
                </Column>
                <Column className="w-22.5 text-right">
                  <Text className="text-xs text-gray-600 font-medium m-0">Price</Text>
                </Column>
              </Row>

              {items.map((item, i) => (
                <Row key={i} className="border-b border-gray-100">
                  <Column className="py-2.5">
                    <Text className="text-sm text-black m-0">{item.name}</Text>
                  </Column>
                  <Column className="w-12.5 text-center">
                    <Text className="text-sm text-gray-500 m-0">{item.quantity}</Text>
                  </Column>
                  <Column className="w-22.5 text-right">
                    <Text className="text-sm text-black m-0">
                      {formatCurrency((item.price ?? 0) * item.quantity)}
                    </Text>
                  </Column>
                </Row>
              ))}
            </Section>

            {/* ── Totals ── */}
            <Section className="px-8 pt-3 pb-6">
              <Row className="mb-1.5">
                <Column>
                  <Text className="text-sm text-gray-500 m-0">Subtotal</Text>
                </Column>
                <Column className="text-right">
                  <Text className="text-sm text-gray-500 m-0">
                    {formatCurrency(total.vatableSales)}
                  </Text>
                </Column>
              </Row>
              {total.vatAmount != null && (
                <Row className="mb-2">
                  <Column>
                    <Text className="text-sm text-gray-500 m-0">Tax (12% VAT)</Text>
                  </Column>
                  <Column className="text-right">
                    <Text className="text-sm text-gray-500 m-0">
                      {formatCurrency(total.vatAmount)}
                    </Text>
                  </Column>
                </Row>
              )}
              <Hr className="border-gray-100 my-2" />
              <Row>
                <Column>
                  <Text className="text-[15px] font-medium text-black m-0">Total</Text>
                </Column>
                <Column className="text-right">
                  <Text className="text-[15px] font-medium text-black m-0">
                    {formatCurrency(total.totalAmount)}
                  </Text>
                </Column>
              </Row>

              {notes && (
                <Section className="my-6 py-2 px-4 bg-gray-100 rounded-lg">
                  <Text className="text-[11px] uppercase text-gray-600">Notes</Text>
                  <Text className="text-sm text-black">{notes}</Text>
                </Section>
              )}
            </Section>

            {/* ── Footer ── */}
            <Section className="px-8 py-5 border-t border-gray-100 text-center">
              <Text className="text-sm text-gray-500 mb-1">
                Questions?{" "}
                <Link
                  href="mailto:hello@harrisoninasalbbq.com.ph"
                  className="text-[#1D9E75]"
                >
                  Reply to this email
                </Link>
              </Text>
              <Text className="text-xs text-gray-600 m-0">
                © 2026 Harrison's Inasál BBQ. All rights reserved.
              </Text>
            </Section>
          </Section>
        </Section>
      </Html>
    </Tailwind>
  );
};

export default OrderSummaryEmail;