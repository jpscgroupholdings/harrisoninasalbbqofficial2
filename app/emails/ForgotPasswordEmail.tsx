import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
  Link,
  Img,
} from "@react-email/components";

interface ForgotPasswordEmailProps {
  user: string;
  email: string;
  resetUrl: string;
}

const publicUrl =
  process.env.NEXT_PUBLIC_URL ?? "https://harrisoninasalbbq.com.ph";

export function ForgotPasswordEmail({
  user,
  email,
  resetUrl,
}: ForgotPasswordEmailProps) {
  const expiryHours = 1;

  return (
    <Tailwind>
      <Html>
        <Head />
        <Preview>Reset your Harrison's Inasál BBQ password</Preview>
        <Body className="bg-white font-sans">
          <Section className="bg-gray-50 py-10 px-4">
            {/* Set max-width correctly for email clients */}
            <Section className="max-w-[500px] mx-auto bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Header / Logo */}
              <Section className="px-8 py-8 border-b border-gray-100 text-center">
                <Img
                  src={`${publicUrl}/images/harrison_logo_landscape.png`}
                  width="180"
                  alt="Harrison Logo"
                  className="mx-auto mb-4"
                />
                <Text className="inline-block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 border-b-2 border-[#ef4501] pb-1 mb-4">
                  Password Reset
                </Text>
                <Text className="text-sm text-gray-600 m-0 leading-relaxed">
                  Hi <span className="font-bold text-black">{user}</span>, we
                  received a request to reset your password for{" "}
                  <span className="text-black">{email}</span>. Click the button
                  below to choose a new one.
                </Text>
              </Section>

              {/* Action Button */}
              <Section className="px-8 py-8 text-center bg-gray-50/50">
                <Button
                  href={resetUrl}
                  className="bg-[#ef4501] text-white text-sm font-bold px-8 py-3 rounded-lg no-underline inline-block"
                >
                  Reset password →
                </Button>
              </Section>

              {/* Notices */}
              <Section className="px-8 py-6 border-t border-gray-100">
                <Section className="bg-white rounded-lg border border-gray-100 px-4 py-3 mb-4">
                  <Text className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Link expiry
                  </Text>
                  <Text className="text-xs text-gray-500 m-0">
                    This link expires in{" "}
                    <span className="text-black font-medium">
                      {expiryHours} hour
                    </span>
                    . After that, you will need to request a new link.
                  </Text>
                </Section>

                <Section className="bg-[#FFFBEB] rounded-lg px-4 py-3 mb-6">
                  <Text className="text-[10px] font-bold uppercase tracking-wider text-[#92400E] mb-1">
                    Heads up
                  </Text>
                  <Text className="text-xs text-[#92400E] m-0">
                    If you didn't request this, just ignore it. Your account is
                    safe.
                  </Text>
                </Section>

                <Text className="text-[11px] text-gray-400 m-0 text-center">
                  Button not working? Copy this link:
                  <br />
                  <Link
                    href={resetUrl}
                    className="text-[#1D9E75] break-all underline"
                  >
                    {resetUrl}
                  </Link>
                </Text>
              </Section>

              {/* Footer */}
              <Section className="px-8 py-6 bg-gray-50 text-center">
                <Text className="text-[10px] text-gray-400 m-0 uppercase tracking-widest">
                  © {new Date().getFullYear()} Harrison's Inasál BBQ
                </Text>
                <Text className="text-[10px] text-gray-400 mt-1">
                  Do not reply to this automated email.
                </Text>
              </Section>
            </Section>
          </Section>
        </Body>
      </Html>
    </Tailwind>
  );
}

export default ForgotPasswordEmail;
