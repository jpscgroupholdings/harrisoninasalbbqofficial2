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
  user: {
    additionalFields: {
      firstName: {
        type: "string",
        required: false,
      },
      lastName: {
        type: "string",
        required: false,
      },
      phone: {
        type: "string",
        required: false,
      },
    },
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: true,

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
    expiresIn: 60 * 15,
    callbackURL: "/verified",
    async sendVerificationEmail({ user, url }) {
      const html = await render(
        VerificationEmail({
          name: user.name || "there",
          verifyUrl: url,
          expiryMinutes: 15,
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
      mapProfileToUser: (profile) => {
        return {
          firstName: profile.given_name,
          lastName: profile.family_name,
          name:
            [profile.given_name, profile.family_name]
              .filter(Boolean)
              .join(" ") || profile.name,
          image: profile.picture,
        };
      },
    },
  },

  plugins: [nextCookies()],

  trustedOrigins: [
    "https://food.harrisoninasalbbq.com.ph",
    "http://localhost:3000",
    "http://localhost:3001",
  ],
});
