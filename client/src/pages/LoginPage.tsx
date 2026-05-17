import { GoogleLogin } from "@react-oauth/google";
import { useDispatch, useSelector } from "react-redux";
import { setCredentials } from "../store/slices/authSlice";
import { useNavigate, Link } from "react-router-dom";
import axiosInstance from "../utils/axios";
import { useState, useEffect } from "react";
import type { RootState } from "../store/store";

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

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const res = await axiosInstance.post("/api/auth/google", {
        idToken: credentialResponse.credential,
      });
      dispatch(setCredentials({ user: res.data, token: res.data.token }));
      navigate("/explore");
    } catch (error: any) {
      console.error("Google Login Error", error);
      setError(error.response?.data?.message || "Failed to log in with Google");
    }
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axiosInstance.post("/api/auth/login", {
        email, password
      });
      dispatch(setCredentials({ user: res.data, token: res.data.token }));
      navigate("/explore");
    } catch (error: any) {
      console.error("Login Error", error);
      setError(error.response?.data?.message || "Invalid email or password");
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
            <input type="password" 
              className="w-full px-4 py-3 bg-white dark:bg-slate-700/50 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 transition-colors shadow-md">
            Sign In
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
