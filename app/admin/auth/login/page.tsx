"use client";

import BrandLogo from "@/components/BrandLogo";
import { InputField } from "@/components/ui/InputField";
import { Loader2, Lock, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { ChangeEvent, useState } from "react";
import { toast } from "sonner";

type CredentialErrors = {
  email?: string;
  password?: string;
};

const LoginPage = () => {
  const route = useRouter();
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<CredentialErrors>({});

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
    setErrors((prev) => ({
      ...prev,
      [e.target.name]: undefined,
    }));
  };

  const validate = (): CredentialErrors => {
    const error: CredentialErrors = {};
    if (!credentials.email.trim()) error.email = "Email is required";
    else if (!/\S+@\S+\.\S+$/.test(credentials.email))
      error.email = "Enter valid email";
    if (!credentials.password.trim()) error.password = "Password is required!";

    return error;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validateErrors = validate();
    if (Object.keys(validateErrors).length > 0) {
      setErrors(validateErrors);
      return;
    }

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
      <main className="grid grid-cols-1 lg:grid-cols-2 min-h-screen w-full">
        {/* Left panel */}
        <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden bg-brand-color-500/90">
          {/* Logo */}
          <BrandLogo color="white" />

          {/* Center content */}
          <div className="relative z-10">
            <h1 className="text-5xl font-extrabold text-white leading-[1.1] mb-6">
              Manage your
              <br />
              <span className="text-dark-green-600">operations</span>
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
                <p className="text-sm font-bold mb-0.5 text-white">{s.value}</p>
                <p className="text-xs text-gray-300">{s.label}</p>
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

          <div className="w-full max-w-xl">
            <div className="mb-8 text-center lg:text-start">
              <p className="mb-4 text-dark-green-500">
                Test Account: <br />
                Email : harrisonmain@gmail.com
                <br />
                Password: 12345678
              </p>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
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
                leftIcon={<Mail size={14} />}
                error={errors.email}
              />
              <InputField
                label="Password"
                placeholder="Enter your password"
                type={`${showPass ? "text" : "password"}`}
                name="password"
                value={credentials.password}
                onChange={handleChange}
                leftIcon={<Lock size={14} />}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="cursor-pointer text-xs hover:text-brand-color-500"
                  >
                    {showPass ? "Hide" : "Show"}
                  </button>
                }
                error={errors.password}
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl text-sm font-semibold bg-brand-color-500 hover:bg-brand-color-600 text-white mt-2 transition-all duration-150 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            <p className="text-xs text-center text-gray-400 mt-8">
              © {new Date().getFullYear()} House of Inasal & BBQ. All rights
              reserved.
            </p>
          </div>
        </div>
      </main>
    </>
  );
};

export default LoginPage;
