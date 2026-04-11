import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
  Img,
} from "@react-email/components";
import { syne } from "../font";

interface OtpEmailProps {
  username: string;
  otpCode: string;
  expiryMinutes?: number;
}

export function OtpEmail({ username, otpCode, expiryMinutes = 10 }: OtpEmailProps) {
  return (
    <Tailwind>
      <Html>
        <Head />
        <Preview>Your verification code — {otpCode}</Preview>

        <Body className={`${syne.className} bg-white m-0 p-0`}>
          <Container className="max-w-140 mx-auto px-6 py-10">

            {/* LOGO */}
            <Section className="text-center mb-8">
              <Img
                src="https://www.harrisoninasalbbq.com.ph/images/harrison_logo_landscape.png/"
                alt="Harrison Inasal BBQ"
                width="200"
                className="mx-auto mb-3"
              />
            </Section>

            {/* Badge */}
            <Text className="inline-block text-[10px] font-mono uppercase px-3 py-1 mb-4 mt-0">
              One-time password
            </Text>

            {/* Heading */}
            <Heading className="text-3xl text-amber-500 font-bold tracking-tight leading-tight mt-0 mb-3">
              Verify it's you
            </Heading>

            {/* Subtext */}
            <Text className="text-sm text-gray-500 leading-relaxed mt-0 mb-7">
              Hi <strong>{username}</strong>, use the code below to complete your verification.
              <br />
              <span className="text-gray-500">
                Never share this code with anyone.
              </span>
            </Text>

            {/* OTP Box */}
            <Section className="bg-[#111111] border border-[#2a2a2a] rounded text-center px-6 py-6 mb-6">
              <Text className="text-[#ef4501] text-5xl font-mono font-bold tracking-[0.3em] mt-0 mb-2">
                {otpCode}
              </Text>
              <Text className="text-white text-xs font-mono tracking-widest mt-0 mb-0">
                Expires in {expiryMinutes} minutes
              </Text>
            </Section>

            {/* CTA fallback (optional but pro) */}
            <Section className="text-center mb-6">
              <Text className="text-[#6b7280] text-xs">
                If the code doesn’t work, request a new one.
              </Text>
            </Section>

            {/* Warning Box */}
            <Section className="bg-[#120f0a] border border-[#2a2010] rounded px-4 py-3 mb-6">
              <Text className="text-[#a16207] text-xs font-mono leading-relaxed mt-0 mb-0">
                ⚠ If you didn't request this, ignore this email. Your account remains safe.
              </Text>
            </Section>

            {/* Divider */}
            <hr className="border-t border-[#1a1a1a] mb-4" />

            {/* Footer */}
            <Text className="text-[#4b5563] text-[11px] font-mono text-center mt-0 mb-0">
              © {new Date().getFullYear()} HarrisonInasalBBQ
              <br />
              This is an automated message — do not reply.
            </Text>

          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}