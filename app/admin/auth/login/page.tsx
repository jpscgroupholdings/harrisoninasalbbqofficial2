"use client";

import BrandLogo from "@/components/BrandLogo";
import { InputField } from "@/components/ui/InputField";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { ChangeEvent, useState } from "react";
import { toast } from "sonner";

const LoginPage = () => {
  const route = useRouter();
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const response = await fetch("/api/auth/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    setLoading(false);

    if (!response.ok) {
      const data = await response.json();
      return toast.error(data.error || "Failed to login");
    }

    toast.success("Login successfully!");
    route.push("/dashboard");
  };

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500&display=swap"
        rel="stylesheet"
      />
      <main
        className="grid grid-cols-1 lg:grid-cols-3 min-h-screen w-full"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {/* Left panel */}
        <div
          className="hidden lg:flex col-span-2 flex-col justify-between p-12 relative overflow-hidden bg-brand-color-500/90"
        >

          {/* Logo */}
         <BrandLogo color="white"/>

          {/* Center content */}
          <div className="relative z-10">
            <h1
              className="text-5xl font-extrabold text-white leading-[1.1] mb-6"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Manage your
              <br />
              <span className="text-dark-green-600">
                operations
              </span>
              <br />
              with ease.
            </h1>
            <p className="text-base max-w-sm text-gray-200">
              Branches, staff, inventory, and orders — all in one place.
            </p>
          </div>

          {/* Bottom stats */}
          <div className="relative z-10 flex gap-8">
            {[
              { value: "Branches", label: "Multi-location support" },
              { value: "Real-time", label: "Order tracking" },
              { value: "Role-based", label: "Staff access" },
            ].map((s) => (
              <div key={s.value}>
                <p
                  className="text-sm font-bold mb-0.5 text-white"
                  style={{
                    fontFamily: "'Syne', sans-serif"
                  }}
                >
                  {s.value}
                </p>
                <p className="text-xs text-gray-300">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel — form */}
        <div className="flex flex-col items-center justify-center w-full px-8 py-12 bg-white">
          {/* Mobile logo */}
         <div className="lg:hidden mb-10">
            <BrandLogo />
         </div>

          <div className="w-full max-w-sm">
            <div className="mb-8">
              <h2
                className="text-2xl font-bold text-gray-900 mb-1"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                Welcome back
              </h2>
              <p className="text-sm text-gray-400">
                Sign in to your admin account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <InputField
                label="Email address"
                placeholder="you@example.com"
                type="email"
                name="email"
                value={credentials.email}
                onChange={handleChange}
              />
              <InputField
                label="Password"
                placeholder="Enter your password"
                type="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl text-sm font-semibold bg-brand-color-500 hover:bg-brand-color-600 text-white mt-2 transition-all duration-150 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin"/>
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            <p className="text-xs text-center text-gray-400 mt-8">
              © {new Date().getFullYear()} House of Inasal & BBQ. All rights reserved.
            </p>
          </div>
        </div>
      </main>
    </>
  );
};

export default LoginPage;