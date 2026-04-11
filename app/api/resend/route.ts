import { NextRequest, NextResponse } from "next/server";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { OtpEmail } from "@/app/emails/OTPEmail";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const { to, name } = await req.json();

  if (!to || !name) {
    return NextResponse.json({ error: "Missing 'to' field" }, { status: 400 });
  }

  const otp = crypto.randomInt(100000, 999999).toString();

  const { data, error } = await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: "One-Time Verification",
    react: OtpEmail({
      username: name,
      otpCode: otp,
      expiryMinutes: 10,
    }),
  });

  // Store hashed OTP in DB with expiry, then verify on submit
  const hashed = crypto.createHash("sha256").update(otp).digest("hex");

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  console.log(error);

  return NextResponse.json({ success: true, id: data?.id });
}
