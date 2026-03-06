"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/api/v1/user/signup", { email, phone: Number(phone), password });
      router.push("/trade");
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Navbar */}
      <header className="border-b border-gray-200 py-5 px-8">
        <Link href="/" className="text-2xl font-semibold text-dark tracking-tight">
          velox
        </Link>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center pt-16">
        <div className="w-full max-w-[480px] px-4">

          {/* Heading */}
          <h1 className="text-[28px] font-bold text-dark mb-8">
            Welcome to Velox
          </h1>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-8">
            <Link
              href="/signin"
              className="flex-1 pb-3 text-sm font-medium text-gray-400 text-center"
            >
              Sign in
            </Link>
            <div className="flex-1 pb-3 text-sm font-semibold text-dark text-center border-b-3 border-dark -mb-px cursor-pointer">
              Create an account
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col">

            {/* Email */}
            <div className="flex flex-col gap-2 mb-6">
              <label className="text-sm text-gray-700">Your email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-md py-3.5 px-3 text-sm focus:outline-none"
              />
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-2 mb-6">
              <label className="text-sm text-gray-700">Phone number</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-gray-300 rounded-md py-3.5 px-3 text-sm focus:outline-none"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2 mb-10">
              <label className="text-sm text-gray-700">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-md py-3.5 pr-10 pl-3 text-sm focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            {/* Register button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand text-dark font-semibold text-sm py-4 rounded-md disabled:opacity-60 transition-colors"
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
