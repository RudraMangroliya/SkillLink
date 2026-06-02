import { GoogleLogin } from "@react-oauth/google";
import { useDispatch, useSelector } from "react-redux";
import { setCredentials } from "../store/slices/authSlice";
import { useNavigate, Link } from "react-router-dom";
import axiosInstance from "../utils/axios";
import { useState, useEffect } from "react";
import type { RootState } from "../store/store";

import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/explore", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.post("/api/auth/google", {
        idToken: credentialResponse.credential,
      });
      dispatch(setCredentials({ user: res.data, token: res.data.token }));
      if (!res.data.profileComplete) {
        navigate("/profile-setup");
      } else {
        navigate("/explore");
      }
    } catch (error: any) {
      console.error("Google Login Error", error);
      setError(error.response?.data?.message || "Failed to log in with Google");
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    try {
      const res = await axiosInstance.post("/api/auth/login", { email, password });
      dispatch(setCredentials({ user: res.data, token: res.data.token }));
      if (!res.data.profileComplete) {
        navigate("/profile-setup");
      } else {
        navigate("/explore");
      }
    } catch (error: any) {
      console.error("Login Error", error);
      setError(error.response?.data?.message || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-4 sm:p-8 border border-transparent dark:border-slate-700 transition-colors">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome Back</h2>
          <p className="text-gray-500 dark:text-gray-400">Sign in to continue to SkillLink</p>
          {error && <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg border border-red-100 dark:border-red-900/50 text-sm">{error}</div>}
        </div>
        
        <form onSubmit={handleManualLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
            <input type="email" 
              className="w-full px-4 py-3 bg-white dark:bg-slate-700/50 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
              <Link to="/forgot-password" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} 
                className="w-full pl-4 pr-12 py-3 bg-white dark:bg-slate-700/50 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center">
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing In...
              </>
            ) : "Sign In"}
          </button>
        </form>

        <div className="mt-8 flex items-center">
          <div className="flex-1 border-t border-gray-200 dark:border-slate-700"></div>
          <span className="px-4 text-sm text-gray-400 dark:text-gray-500">Or continue with</span>
          <div className="flex-1 border-t border-gray-200 dark:border-slate-700"></div>
        </div>

        <div className="mt-6 flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
              console.log('Login Failed');
            }}
            shape="rectangular"
            theme="outline"
            text="signin_with"
          />
        </div>
        
        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Don't have an account? <Link to="/register" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
