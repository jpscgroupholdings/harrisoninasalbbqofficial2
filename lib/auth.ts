import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { MongoClient } from "mongodb";
import { nextCookies } from "better-auth/next-js";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { render } from "@react-email/render";
import { createAuthMiddleware, APIError } from "better-auth/api";

import { VerificationEmail } from "@/app/emails/VerificationEmail";
import { ForgotPasswordEmail } from "@/app/emails/ForgotPasswordEmail";
import { expo } from "@better-auth/expo"; // ✅ correct

/** Only gmail.com addresses are accepted for customer signup/login. */
const CUSTOMER_EMAIL_DOMAIN = "gmail.com";

/** Password must meet these complexity requirements. */
function isPasswordSecure(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

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
      publicId: {
        type: "string",
        required: false,
      },
    },
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: true,
    minPasswordLength: 8,

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
      prompt: "select_account",
    },
  },

  plugins: [nextCookies(), expo()],

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      // Validate email domain + password complexity on customer signup
      if (ctx.path === "/sign-up/email") {
        const body = ctx.body as { email?: string; password?: string };
        const email = body.email?.trim().toLowerCase();
        if (email) {
          const domain = email.split("@")[1];
          if (domain !== CUSTOMER_EMAIL_DOMAIN) {
            throw new APIError("BAD_REQUEST", {
              message: `Only @${CUSTOMER_EMAIL_DOMAIN} email addresses are accepted`,
            });
          }
        }
        const password = body.password;
        if (password && !isPasswordSecure(password)) {
          throw new APIError("BAD_REQUEST", {
            message:
              "Password must be at least 8 characters with at least one uppercase letter, one number, and one symbol",
          });
        }
      }

      // Validate email domain on customer email login
      if (ctx.path === "/sign-in/email") {
        const body = ctx.body as { email?: string };
        const email = body.email?.trim().toLowerCase();
        if (email) {
          const domain = email.split("@")[1];
          if (domain !== CUSTOMER_EMAIL_DOMAIN) {
            throw new APIError("BAD_REQUEST", {
              message: `Only @${CUSTOMER_EMAIL_DOMAIN} email addresses are accepted`,
            });
          }
        }
      }
    }),
  },

  trustedOrigins: [
    "https://food.harrisoninasalbbq.com.ph",
    "http://localhost:3000",
    "http://localhost:3001",

    "harrison://",
    "harrison://*",

    // if testing in Expo Go
    "exp://",
    "exp://**",
  ],
});
