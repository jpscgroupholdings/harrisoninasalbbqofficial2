import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
  Hr,
  Link,
  Img,
} from "@react-email/components";

interface VerificationEmailProps {
  name: string;
  verifyUrl: string;
  expiryHours?: number;
}

const publicUrl =
  process.env.NEXT_PUBLIC_URL ?? "https://harrisoninasalbbq.com.ph";

export function VerificationEmail({
  name,
  verifyUrl,
  expiryHours = 24,
}: VerificationEmailProps) {
  return (
    <Tailwind>
      <Html>
        <Head />
        <Preview>Verify your email to access your account</Preview>
        <Body className="bg-[#0a0a0a] font-serif m-0 p-0">
          <Container className="max-w-140 mx-auto px-6 py-10">
            {/* Brand Logo*/}
            <Img
              src={`${publicUrl}/images/harrison_logo_landscape.png`}
              width="200"
              alt="Harrison Logo"
              className="mx-auto mb-3"
            />

            {/* Badge */}
            <Text className="inline-block bg-[#1a1a1a] text-[#ef4501] text-[10px] font-mono tracking-[0.15em] uppercase px-3 py-1 border border-[#2a2a2a] rounded-sm mb-4 mt-0">
              Email Verification
            </Text>

            {/* Heading */}
            <Heading className="text-[#f5f0e8] text-3xl font-normal tracking-tight leading-tight mt-0 mb-3">
              Confirm your address
            </Heading>

            {/* Subtext */}
            <Text className="text-[#7a7a7a] text-sm leading-relaxed mt-0 mb-8">
              Hi {name}, you're almost there. Click the button below to verify
              your email address and activate your account.
            </Text>

            {/* CTA Button */}
            <Section className="mb-8">
              <Button
                href={verifyUrl}
                className="bg-[#ef4501] text-[#0a0a0a] text-sm font-mono font-bold tracking-widest uppercase px-8 py-4 rounded-sm no-underline inline-block"
              >
                Verify Email Address →
              </Button>
            </Section>

            {/* Expiry notice */}
            <Section className="bg-[#111111] border border-[#2a2a2a] rounded px-4 py-3 mb-6">
              <Text className="text-[#4a4a4a] text-xs font-mono leading-relaxed mt-0 mb-0">
                ⏱ This link expires in{" "}
                <span className="text-[#ef4501]">{expiryHours} hours</span>.
                After that you'll need to request a new one.
              </Text>
            </Section>

            {/* Warning */}
            <Section className="bg-[#120f0a] border border-[#2a2010] rounded px-4 py-3 mb-6">
              <Text className="text-[#f8f801] text-xs font-mono leading-relaxed mt-0 mb-0">
                ⚠ If you didn't create an account, ignore this email. No action
                is needed.
              </Text>
            </Section>

            {/* Fallback link */}
            <Text className="text-[#4a4a4a] text-xs font-mono mt-0 mb-6">
              Button not working? Copy this link:{" "}
              <Link href={verifyUrl} className="text-[#ef4501]">
                {verifyUrl}
              </Link>
            </Text>

            <Hr className="border-t border-[#1a1a1a] mb-4" />

            {/* Footer */}
            <Text className="text-[#333333] text-[11px] font-mono text-center mt-0 mb-0">
              © {new Date().getFullYear()} HarrisonInasalBBQ · Do not reply to
              this email.
            </Text>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}
