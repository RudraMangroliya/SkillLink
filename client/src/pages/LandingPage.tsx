import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";
import { Target, MessageSquare, TrendingUp } from "lucide-react";
import SEO from "../components/SEO";

export default function LandingPage() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 to-white dark:from-slate-900 dark:to-slate-800 transition-colors duration-300">
      <SEO 
        title="AI-Powered Professional Networking & Job Matching" 
        description="Connect with mentors, find AI-matched jobs, join groups, and accelerate your career growth on SkillLink, the leading professional ecosystem."
      />
      {/* Hero Section */}
      <div className="flex-grow flex flex-col justify-center items-center text-center px-4 py-20">
        <div className="max-w-3xl mt-10">
          <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-6">
            Welcome to <span className="text-indigo-600 dark:text-indigo-400">SkillLink</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-10">
            The AI-powered professional networking platform designed to connect you with mentors, jobs, and like-minded professionals seamlessly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:space-x-4 sm:gap-0 justify-center items-center">
            <Link
              to={isAuthenticated ? "/explore" : "/login"}
              className="px-8 py-4 bg-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:bg-indigo-700 hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto"
            >
              {isAuthenticated ? "Go to Dashboard" : "Get Started"}
            </Link>
            <button 
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-semibold rounded-xl shadow-md border border-indigo-100 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-all duration-300 w-full sm:w-auto"
            >
              Learn More
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="bg-white dark:bg-slate-900 py-24 border-t border-gray-100 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">Everything you need to grow your career</h2>
            <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">Discover all the tools SkillLink provides to help you succeed.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-indigo-50 dark:bg-slate-800 rounded-2xl p-8 hover:shadow-md transition-all border border-transparent dark:border-slate-700">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6">
                <Target size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">AI Job Matching</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">Our recommendation engine analyzes your skills and resume to find the perfect job opportunities tailored just for you.</p>
            </div>
            <div className="bg-indigo-50 dark:bg-slate-800 rounded-2xl p-8 hover:shadow-md transition-all border border-transparent dark:border-slate-700">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6">
                <MessageSquare size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Smart Networking</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">Connect with professionals, join niche groups, and utilize our AI Smart Replies to keep conversations flowing seamlessly.</p>
            </div>
            <div className="bg-indigo-50 dark:bg-slate-800 rounded-2xl p-8 hover:shadow-md transition-all border border-transparent dark:border-slate-700">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6">
                <TrendingUp size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Career Growth</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">Build your professional portfolio, track your applications, and unlock personalized insights to accelerate your success.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
