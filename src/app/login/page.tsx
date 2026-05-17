"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { authService } from "../../lib/api";
import { Eye, EyeOff, Loader2, Car } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

type LoginMode = "password" | "otp-send" | "otp-verify";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<LoginMode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ email, password });
      router.replace("/dashboard");
    } catch {
      toast.error("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error("Enter your email first"); return; }
    setLoading(true);
    try {
      await authService.sendOtp(email);
      toast.success("OTP sent to your email");
      setMode("otp-verify");
    } catch {
      toast.error("Failed to send OTP. Check your email.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { loginWithOtp } = await import("../../contexts/AuthContext").then(m => ({ loginWithOtp: null }));
      // Use the auth context method
      const { authService: as } = await import("../../lib/api");
      const res = await as.verifyOtpLogin(email, otp);
      localStorage.setItem("jwt", res.jwt);
      localStorage.setItem("user", JSON.stringify(res.user));
      router.replace("/dashboard");
      window.location.href = "/dashboard";
    } catch {
      toast.error("Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl mb-4 shadow-lg shadow-black/30 p-1">
            <Image src="/logo.png" alt="Rahul Motors" width={72} height={72} className="object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-white">Rahul Motors</h1>
          <p className="text-gray-400 text-sm mt-1">Admin Panel</p>
        </div>

        {/* Card */}
        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 shadow-2xl">
          <h2 className="text-lg font-semibold text-white mb-6">
            {mode === "password" ? "Sign in to your account" : mode === "otp-send" ? "Login with OTP" : "Enter OTP"}
          </h2>

          {mode === "password" && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-gray-900 font-semibold rounded-lg transition flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                {loading ? "Signing in..." : "Sign In"}
              </button>
              <button
                type="button"
                onClick={() => setMode("otp-send")}
                className="w-full py-2 text-amber-400 hover:text-amber-300 text-sm font-medium transition"
              >
                Login with OTP instead
              </button>
            </form>
          )}

          {mode === "otp-send" && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-gray-900 font-semibold rounded-lg transition flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
              <button type="button" onClick={() => setMode("password")} className="w-full py-2 text-amber-400 hover:text-amber-300 text-sm font-medium transition">
                Back to password login
              </button>
            </form>
          )}

          {mode === "otp-verify" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <p className="text-gray-400 text-sm">OTP sent to <span className="text-white font-medium">{email}</span></p>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Enter OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  maxLength={6}
                  required
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition text-center text-xl tracking-widest font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-gray-900 font-semibold rounded-lg transition flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                {loading ? "Verifying..." : "Verify & Login"}
              </button>
              <button type="button" onClick={() => setMode("otp-send")} className="w-full py-2 text-amber-400 hover:text-amber-300 text-sm font-medium transition">
                Resend OTP
              </button>
            </form>
          )}
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-gray-500 text-sm">
          <Car size={14} />
          <span>Rahul Motors Parts Management System</span>
        </div>
      </div>
    </div>
  );
}
