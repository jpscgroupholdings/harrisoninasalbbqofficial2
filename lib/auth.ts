import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { MongoClient } from "mongodb";
import { nextCookies } from "better-auth/next-js";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { render } from "@react-email/render";

import { VerificationEmail } from "@/app/emails/VerificationEmail";
import { ForgotPasswordEmail } from "@/app/emails/ForgotPasswordEmail";

const client = new MongoClient(process.env.MONGODB_URI!);
const db = client.db();

export const auth = betterAuth({
  database: mongodbAdapter(db, { client }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: false,

    // 🔹 SEND RESET EMAIL
    sendResetPassword: async ({ user, url }) => {
      const html = await render(
        ForgotPasswordEmail({
          user: user.name || "there",
          email: user.email,
          resetUrl: url, // full reset link
        }),
      );

      await resend.emails.send({
        from: EMAIL_FROM,
        to: user.email,
        subject: "Reset your password",
        html,
      });
    },

    // 🔹 AFTER PASSWORD RESET
    onPasswordReset: async ({ user }) => {
      console.log(`Password reset for ${user.email}`);
    },
  },

  accountLinking: {
    enabled: true,
    trustedProviders: ["google"],
  },

  emailVerification: {
    async sendVerificationEmail({ user, url }) {
      const html = await render(
        VerificationEmail({
          name: user.name || "there",
          verifyUrl: url,
          expiryHours: 24,
        }),
      );

      await resend.emails.send({
        from: EMAIL_FROM,
        to: user.email,
        subject: "Verify your email",
        html,
      });
    },
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  plugins: [nextCookies()],

  trustedOrigins: [
    "https://food.harrisoninasalbbq.com.ph",
    "http://localhost:3000",
  ],
});
