import {
  Head,
  Html,
  Preview,
  Tailwind,
  Text,
  Section,
  Row,
  Column,
  Link,
  Img,
  Button,
} from "@react-email/components";
import React from "react";
import { OrderType } from "@/types/OrderTypes";
import { OrderStatus } from "@/types/orderConstants";

interface OrderMessageEmailProps {
  order: OrderType;
}

/* ── Status accent color ── */
function getAccentColor(status: OrderStatus): string {
  switch (status) {
    case "paid":
    case "preparing":
    case "completed":
      return "#1D9E75";
    case "pending":
      return "#ef4501";
    case "failed":
    case "cancelled":
      return "#dc2626";
    case "expired":
      return "#d97706";
    default:
      return "#ef4501";
  }
}

/* ── All copy derived from status ── */
function getStatusContent(
  status: OrderStatus,
  publicUrl: string,
  referenceNumber: string,
) {
  switch (status) {
    case "pending":
      return {
        preview: "Complete your payment to confirm your order",
        heading: "Payment needed",
        message:
          "Your order has been placed! Complete your payment to get it confirmed and we'll start preparing it right away.",
        ctaLabel: "Pay now",
        ctaHref: `${publicUrl}/orders?referenceNumber=${referenceNumber}`,
      };
    case "failed":
      return {
        preview: "We couldn't complete your order",
        heading: "Order unsuccessful",
        message:
          "Something went wrong while processing your order. Please try again or contact us if the issue continues.",
        ctaLabel: "Try again",
        ctaHref: `${publicUrl}/`,
      };
    case "cancelled":
      return {
        preview: "Your order has been cancelled",
        heading: "Order cancelled",
        message:
          "Your order has been cancelled. If you didn't request this or have any concerns, please don't hesitate to reach out.",
      };
    case "expired":
      return {
        preview: "Your order has expired",
        heading: "Order expired",
        message:
          "Your order wasn't completed in time and has expired. You can place a new order whenever you're ready.",
        ctaLabel: "Place a new order",
        ctaHref: `${publicUrl}/`,
      };
    default:
      return {
        preview: "An update on your order",
        heading: "Order update",
        message:
          "There has been an update to your order. Contact us if you have any questions.",
      };
  }
}

/* ── mock ── */
const mockOrder: OrderType = {
  _id: "64a3f2b81c9e4d0012ab81c9",
  createdAt: "2026-04-15T10:32:00.000Z",
  status: "pending",
  branchSnapshot: {
    name: "Century Mall",
    code: "BR-001",
    address: "Makati City",
    contactNumber: "096339749837",
  },
  estimatedTime: "25–35 minutes",
  notes: "",
  items: [],
  paymentInfo: {
    method: {
      type: "paymaya",
      description: "***** ***0900",
      scheme: "Visa",
      last4: "4242",
    },
    referenceNumber: "TXN-20260415-0081",
    paymentStatus: "unpaid",
    firstname: "Maria",
    lastname: "Santos",
    customerEmail: "maria.santos@gmail.com",
    customerPhone: "+63 917 555 0123",

    shippingAddress: {
      line1: "Santol St.",
      line2: "Poblacion",
      city: "Makati City",
      province: "Metro Manila",
      postalCode: "4023",
      country: "Philippines",
      landmark: "Banda kina ate ruth",
    },
  },
  total: { vatableSales: 0, vatAmount: 0, totalAmount: 0 },
};

const publicUrl =
  process.env.NEXT_PUBLIC_URL ?? `https://harrisoninasalbbq.com.ph`;

const OrderMessageEmail = ({ order = mockOrder }: OrderMessageEmailProps) => {
  const { status, paymentInfo } = order;
  const {firstname} = paymentInfo
  const accentColor = getAccentColor(status);
  const { preview, heading, message, ctaLabel, ctaHref } = getStatusContent(
    status,
    publicUrl,
    order.paymentInfo?.referenceNumber ?? "",
  );

  return (
    <Tailwind>
      <Html>
        <Head />
        <Preview>
          Order #{paymentInfo.referenceNumber ?? ""} — {preview}
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
              <Text
                className="inline-block text-xs uppercase tracking-widest text-black pb-0.5 mb-2"
                style={{ borderBottom: `1px solid ${accentColor}` }}
              >
                {heading}
              </Text>
              <Text className="text-sm text-gray-600 m-0">
                Hi <span className="font-medium text-black">{firstname}</span>
                {" — "}
                {message}
              </Text>
            </Section>

            {/* ── Reference number ── */}
            <Section className="px-8 py-4 border-b border-gray-100">
              <Row>
                <Column>
                  <Text className="text-[11px] uppercase tracking-[0.04em] text-gray-600 mb-1">
                    Order reference
                  </Text>
                  <Text className="text-sm font-medium text-black m-0">
                    #{paymentInfo.referenceNumber?.toUpperCase()}
                  </Text>
                </Column>
              </Row>
            </Section>

            {/* ── CTA ── */}
            {ctaLabel && ctaHref ? (
              <Section className="px-8 py-8 text-center">
                <Button
                  href={ctaHref}
                  style={{
                    backgroundColor: accentColor,
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: "500",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    padding: "12px 32px",
                    borderRadius: "6px",
                    textDecoration: "none",
                    display: "inline-block",
                  }}
                >
                  {ctaLabel}
                </Button>
              </Section>
            ) : (
              <Section className="py-4" />
            )}

            {/* ── Footer ── */}
            <Section className="px-8 py-5 border-t border-gray-100 text-center">
              <Text className="text-sm text-gray-500 mb-1">
                Questions?{" "}
                <Link
                  href="mailto:harrisoninasalbbq@gmail.com"
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

export default OrderMessageEmail;
