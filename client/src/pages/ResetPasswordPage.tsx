import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../utils/axios";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialEmail = queryParams.get("email") || "";

  const [email] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [timeLeft, setTimeLeft] = useState(120);

  useEffect(() => {
    if (timeLeft <= 0 || status === "success") return;
    
    const timerId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    
    return () => clearInterval(timerId);
  }, [timeLeft, status]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await axiosInstance.post("/api/auth/reset-password", { email, otp, newPassword });
      setStatus("success");
      setMessage(res.data.message);
      setTimeout(() => navigate("/login"), 3000);
    } catch (error: any) {
      setStatus("error");
      setMessage(error.response?.data?.message || "Failed to reset password. Invalid OTP.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-8 border border-transparent dark:border-slate-700 transition-colors">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Create New Password</h2>
          <p className="text-gray-500 dark:text-gray-400">Enter your 6-digit OTP and new password</p>
          {status !== "success" && (
            <div className={`mt-3 font-mono text-lg font-semibold ${timeLeft > 0 ? "text-indigo-600" : "text-red-500"}`}>
              {timeLeft > 0 ? `Code expires in: ${formatTime(timeLeft)}` : "Code expired!"}
            </div>
          )}
        </div>

        {status === "success" ? (
          <div className="text-center">
            <div className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 p-4 rounded-xl border border-green-100 dark:border-green-800/50 mb-6">
              {message}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Redirecting to login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {status === "error" && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg border border-red-100 dark:border-red-800/50 text-sm">
                {message}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
              <input type="email" 
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 text-gray-900 dark:text-gray-300 outline-none cursor-not-allowed transition-colors"
                value={email}
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">6-Digit OTP</label>
              <input type="text" 
                maxLength={6}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none tracking-widest text-center text-lg transition-colors"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
              <input type="password" 
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={status === "loading" || otp.length !== 6 || newPassword.length < 6 || timeLeft <= 0}
              className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center mt-2"
            >
              {status === "loading" ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Resetting...
                </>
              ) : timeLeft <= 0 ? "OTP Expired" : "Reset Password"}
            </button>
            
            {timeLeft <= 0 && (
              <p className="text-center text-sm mt-4 text-gray-600 dark:text-gray-400">
                Didn't get the code or it expired? <Link to="/forgot-password" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">Request a new one</Link>
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
