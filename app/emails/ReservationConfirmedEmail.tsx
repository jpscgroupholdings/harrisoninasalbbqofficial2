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
import { formatDateWithDay } from "@/helper/formatter";

interface ReservationConfirmedEmailProps {
  order: OrderType;
}

const publicUrl =
  process.env.NEXT_PUBLIC_URL ?? "https://harrisoninasalbbq.com.ph";

const ReservationConfirmedEmail = ({
  order,
}: ReservationConfirmedEmailProps) => {
  const { paymentInfo, branchSnapshot, reservation } = order;
  const { firstName } = paymentInfo;
  const accentColor = "#4f46e5"; // indigo-600

  const scheduledDate = reservation?.scheduledAt
    ? formatDateWithDay(reservation.scheduledAt)
    : "Date not set";
  const partySize = reservation?.partySize ?? 1;

  return (
    <Tailwind>
      <Html>
        <Head />
        <Preview>
          Your reservation at {branchSnapshot?.name ?? "Harrison's"} is confirmed —{" "}
          {scheduledDate}
        </Preview>

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
                Reservation Confirmed
              </Text>
              <Text className="text-sm text-gray-600 m-0">
                Hi{" "}
                <span className="font-medium text-black">{firstName}</span>
                {" — "}
                Your reservation has been confirmed. We&apos;ll have
                your table ready when you arrive.
              </Text>
            </Section>

            {/* ── Reservation Details ── */}
            <Section className="px-8 py-5 border-b border-gray-100">
              <Row>
                <Column className="w-1/2 pr-2">
                  <Text className="text-[11px] uppercase tracking-[0.04em] text-gray-600 mb-1">
                    Date & Time
                  </Text>
                  <Text className="text-sm font-medium text-black m-0">
                    {scheduledDate}
                  </Text>
                </Column>
                <Column className="w-1/2 pl-2">
                  <Text className="text-[11px] uppercase tracking-[0.04em] text-gray-600 mb-1">
                    Guests
                  </Text>
                  <Text className="text-sm font-medium text-black m-0">
                    {partySize} {partySize === 1 ? "guest" : "guests"}
                  </Text>
                </Column>
              </Row>
            </Section>

            {/* ── Branch + Reference ── */}
            <Section className="px-8 py-4 border-b border-gray-100">
              <Row>
                <Column className="w-1/2 pr-2">
                  <Text className="text-[11px] uppercase tracking-[0.04em] text-gray-600 mb-1">
                    Branch
                  </Text>
                  <Text className="text-sm font-medium text-black m-0">
                    {branchSnapshot?.name}
                  </Text>
                  {branchSnapshot?.address && (
                    <Text className="text-xs text-gray-500 m-0 mt-0.5">
                      {branchSnapshot.address}
                    </Text>
                  )}
                </Column>
                <Column className="w-1/2 pl-2">
                  <Text className="text-[11px] uppercase tracking-[0.04em] text-gray-600 mb-1">
                    Order reference
                  </Text>
                  <Text className="text-sm font-medium text-black m-0">
                    #{paymentInfo.referenceNumber?.toUpperCase()}
                  </Text>
                </Column>
              </Row>
            </Section>

            {/* ── Order Total ── */}
            <Section className="px-8 py-4 border-b border-gray-100">
              <Row>
                <Column>
                  <Text className="text-[11px] uppercase tracking-[0.04em] text-gray-600 mb-1">
                    Order total
                  </Text>
                  <Text className="text-base font-bold text-black m-0">
                    ₱{order.total.totalAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </Text>
                  <Text className="text-xs text-gray-500 m-0 mt-0.5">
                    Pay at branch {paymentInfo.paymentMethod === "maya" ? "(or via Maya)" : ""}
                  </Text>
                </Column>
              </Row>
            </Section>

            {/* ── CTA ── */}
            <Section className="px-8 py-8 text-center">
              <Button
                href={`${publicUrl}/orders`}
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
                View your order
              </Button>
            </Section>

            {/* ── Note ── */}
            <Section className="px-8 py-4 border-t border-gray-100">
              <Text className="text-xs text-gray-500 m-0 text-center">
                Please arrive within 15 minutes of your reserved time. Late
                arrivals may result in your table being given to walk-in guests.
              </Text>
            </Section>

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
                © 2026 Harrison&apos;s Inasál BBQ. All rights reserved.
              </Text>
            </Section>
          </Section>
        </Section>
      </Html>
    </Tailwind>
  );
};

export default ReservationConfirmedEmail;
