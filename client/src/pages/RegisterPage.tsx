import { GoogleLogin } from "@react-oauth/google";
import { useDispatch, useSelector } from "react-redux";
import { setCredentials } from "../store/slices/authSlice";
import { useNavigate, Link } from "react-router-dom";
import axiosInstance from "../utils/axios";
import { useState, useEffect } from "react";
import type { RootState } from "../store/store";

import { Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/explore", { replace: true });
    }
  }, [isAuthenticated, navigate]);
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.post("/api/auth/google", {
        idToken: credentialResponse.credential,
        role: role
      });
      // The backend creates an account if it doesn't exist
      dispatch(setCredentials({ user: res.data, token: res.data.token }));
      if (!res.data.profileComplete) {
        navigate("/profile-setup");
      } else {
        navigate("/explore");
      }
    } catch (error: any) {
      console.error("Google Sign Up Error", error);
      setError(error.response?.data?.message || "Failed to sign up with Google");
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    try {
      const res = await axiosInstance.post("/api/auth/register", {
        name, email, password, role
      });
      dispatch(setCredentials({ user: res.data, token: res.data.token }));
      navigate("/profile-setup");
    } catch (error: any) {
      console.error("Registration Error", error);
      setError(error.response?.data?.message || "Registration failed. Email might already be in use.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-4 sm:p-8 my-8 border border-transparent dark:border-slate-700 transition-colors">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">Create an Account</h2>
          <p className="text-gray-500 dark:text-gray-400">Join SkillLink to connect and grow</p>
          {error && <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg border border-red-100 dark:border-red-900/50 text-sm">{error}</div>}
        </div>
        
        <form onSubmit={handleManualRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
            <input type="text" 
              className="w-full px-4 py-2 bg-white dark:bg-slate-700/50 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
            <input type="email" 
              className="w-full px-4 py-2 bg-white dark:bg-slate-700/50 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} 
                className="w-full pl-4 pr-12 py-2 bg-white dark:bg-slate-700/50 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
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
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">I am a...</label>
            <select className="w-full px-4 py-2 bg-white dark:bg-slate-700/50 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all [&>option]:text-gray-900"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="student">Student</option>
              <option value="professional">Professional</option>
              <option value="mentor">Mentor</option>
              <option value="recruiter">Recruiter</option>
            </select>
          </div>
          <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center">
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing Up...
              </>
            ) : "Sign Up"}
          </button>
        </form>

        <div className="mt-6 flex items-center">
          <div className="flex-1 border-t border-gray-200 dark:border-slate-700"></div>
          <span className="px-4 text-sm text-gray-400 dark:text-gray-500">Or sign up with</span>
          <div className="flex-1 border-t border-gray-200 dark:border-slate-700"></div>
        </div>

        <div className="mt-6 flex justify-center">
          {/* This button handles Google Sign Up and Sign In simultaneously */}
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
              console.log('Google Signup Failed');
            }}
            shape="rectangular"
            theme="outline"
            text="signup_with"
          />
        </div>
        
        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account? <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">Log in</Link>
        </p>
      </div>
    </div>
  );
}
