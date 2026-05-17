import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axios";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await axiosInstance.post("/api/auth/forgot-password", { email });
      setStatus("success");
      setMessage(res.data.message);
      
      // Automatically redirect to the reset password page with the email
      setTimeout(() => {
        navigate(`/reset-password?email=${encodeURIComponent(email)}`);
      }, 1500);
    } catch (error: any) {
      setStatus("error");
      setMessage(error.response?.data?.message || "Failed to send OTP. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-8 border border-transparent dark:border-slate-700 transition-colors">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Reset Password</h2>
          <p className="text-gray-500 dark:text-gray-400">Enter your email to receive an OTP</p>
        </div>

        {status === "success" ? (
          <div className="text-center">
            <div className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 p-4 rounded-xl border border-green-100 dark:border-green-800/50 mb-6 flex flex-col items-center">
              <span className="block font-medium mb-2">{message}</span>
              <span className="text-sm">Redirecting to enter code...</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {status === "error" && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg border border-red-100 dark:border-red-800/50 text-sm">
                {message}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
              <input type="email" 
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={status === "loading"}
              className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 transition shadow-md disabled:opacity-70 flex justify-center items-center"
            >
              {status === "loading" ? "Sending..." : "Send OTP"}
            </button>
          </form>
        )}
        
        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Remember your password? <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">Log in</Link>
        </p>
      </div>
    </div>
  );
}
