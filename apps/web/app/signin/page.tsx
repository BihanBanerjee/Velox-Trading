"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";

type AuthTab = "password" | "magic-link";

export default function SignIn() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AuthTab>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/api/v1/user/signin", { email, password });
      router.push("/trade");
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLinkSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/api/v1/user/magic-link", { email });
      setMagicLinkSent(true);
    } catch (err: any) {
      const message = err.response?.data?.message || "Something went wrong. Please try again.";
      setError(message);
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

          {/* Sign in / Register tabs */}
          <div className="flex border-b border-gray-200 mb-8">
            <div className="flex-1 pb-3 text-sm font-semibold text-dark text-center border-b-3 border-dark -mb-px cursor-pointer">
              Sign in
            </div>
            <Link
              href="/register"
              className="flex-1 pb-3 text-sm font-medium text-gray-400 text-center"
            >
              Create an account
            </Link>
          </div>

          {/* Auth method tabs */}
          <div className="flex mb-6 gap-1">
            <button
              onClick={() => { setActiveTab("password"); setError(""); setMagicLinkSent(false); }}
              className={`flex-1 pb-3 text-sm text-center bg-transparent border-none -mb-px cursor-pointer ${
                activeTab === "password"
                  ? "font-semibold text-dark border-b-3 border-dark"
                  : "font-medium text-gray-400"
              }`}
            >
              Password
            </button>
            <button
              onClick={() => { setActiveTab("magic-link"); setError(""); setMagicLinkSent(false); }}
              className={`flex-1 pb-3 text-sm text-center bg-transparent border-none -mb-px cursor-pointer ${
                activeTab === "magic-link"
                  ? "font-semibold text-dark border-b-3 border-dark"
                  : "font-medium text-gray-400"
              }`}
            >
              Email Link
            </button>
          </div>

          {/* Password form */}
          {activeTab === "password" && (
            <form onSubmit={handlePasswordSubmit} className="flex flex-col">
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

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand text-dark font-semibold text-sm py-4 rounded-md disabled:opacity-60 transition-colors"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>
          )}

          {/* Magic link form */}
          {activeTab === "magic-link" && (
            <>
              {magicLinkSent ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-brand-light flex items-center justify-center mb-4 text-2xl">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#FFB800" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-dark mb-2">
                    Check your inbox
                  </h2>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    We sent a sign-in link to <strong>{email}</strong>. Click the link in the email to sign in.
                  </p>
                  <button
                    onClick={() => { setMagicLinkSent(false); setEmail(""); }}
                    className="mt-6 text-sm text-brand font-semibold bg-transparent border-none cursor-pointer"
                  >
                    Use a different email
                  </button>
                </div>
              ) : (
                <form onSubmit={handleMagicLinkSubmit} className="flex flex-col">
                  <div className="flex flex-col gap-2 mb-10">
                    <label className="text-sm text-gray-700">Your email address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border border-gray-300 rounded-md py-3.5 px-3 text-sm focus:outline-none"
                    />
                  </div>

                  {error && (
                    <div className="mb-4">
                      <p className="text-red-500 text-sm">{error}</p>
                      {error.includes("register") && (
                        <Link href="/register" className="text-brand text-sm font-semibold">
                          Create an account
                        </Link>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-brand text-dark font-semibold text-sm py-4 rounded-md disabled:opacity-60 transition-colors"
                  >
                    {loading ? "Sending..." : "Send Magic Link"}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
