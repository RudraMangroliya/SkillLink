import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";
import { Target, MessageSquare, TrendingUp, Briefcase, MessageCircle, Sparkles } from "lucide-react";
import SEO from "../components/SEO";

// Custom visual assets
import networkMapImg from "../assets/network_map.png";
import chatCommunicationImg from "../assets/chat_communication.png";

export default function LandingPage() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-gradient-to-br from-[#f8faff] via-[#eef2ff] to-[#e0e7ff] dark:from-[#0b1121] dark:via-[#0f172a] dark:to-[#1e1b4b] transition-colors duration-500">
      <SEO 
        title="AI-Powered Professional Networking & Job Matching" 
        description="Connect with mentors, find AI-matched jobs, join groups, and accelerate your career growth on SkillLink, the leading professional ecosystem."
      />

      {/* Crypgo-style Background Blur Circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="circle1 opacity-80 dark:opacity-30"></div>
        <div className="circle2 opacity-80 dark:opacity-30"></div>
      </div>

      {/* Hero Section */}
      <div className="relative flex-grow flex items-center justify-center z-10">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20 lg:py-28 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Text & Calls to Action */}
          <div className="lg:col-span-5 text-left flex flex-col justify-center animate-fade-in-slide">
            
            {/* Glowing Accent Badge */}
            <div className="inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100/50 dark:border-indigo-900/30 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-6 backdrop-blur-sm shadow-sm">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              <span className="flex items-center gap-1"><Sparkles size={12} /> Redefining Professional Networks</span>
            </div>

            {/* Premium Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-6">
              Connect. Network.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400">
                Get Hired.
              </span>
            </h1>

            {/* Premium Subtitle */}
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-8 max-w-xl">
              SkillLink uses AI-powered matching, real-time messaging, and professional networking to connect talent with opportunity.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Link
                to={isAuthenticated ? "/explore" : "/login"}
                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 hover:-translate-y-0.5 active:scale-95 transition-all duration-300 text-center"
              >
                {isAuthenticated ? "Go to Dashboard" : "Get Started"}
              </Link>
              <Link 
                to={isAuthenticated ? "/jobs" : "/explore"}
                className="px-8 py-4 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl shadow-md border border-indigo-100 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-700 hover:-translate-y-0.5 active:scale-95 transition-all duration-300 text-center"
              >
                Find Jobs
              </Link>
            </div>

            {/* Grid Metrics */}
            <div className="border-t border-indigo-100/50 dark:border-slate-800/50 pt-8 flex gap-8 md:gap-12">
              <div>
                <span className="block text-2xl md:text-3xl font-black text-indigo-600 dark:text-indigo-400">10K+</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold">Active Users</span>
              </div>
              <div className="border-l border-indigo-100/50 dark:border-slate-800/50 pl-8">
                <span className="block text-2xl md:text-3xl font-black text-indigo-600 dark:text-indigo-400">500+</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold">Recruiters</span>
              </div>
              <div className="border-l border-indigo-100/50 dark:border-slate-800/50 pl-8">
                <span className="block text-2xl md:text-3xl font-black text-indigo-600 dark:text-indigo-400">2K+</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold">Jobs Added</span>
              </div>
            </div>

          </div>

          {/* Right Column: Centerpiece Map & Floating Visual Elements */}
          <div className="lg:col-span-7 flex justify-center items-center relative mt-10 lg:mt-0 select-none animate-fade-in-slide delay-200">
            
            {/* The Main Network Map Image */}
            <div className="relative max-w-[650px] w-full p-4 animate-float">
              <img 
                src={networkMapImg} 
                className="w-full h-auto object-contain filter drop-shadow-[0_25px_50px_rgba(0,0,0,0.06)] dark:drop-shadow-[0_25px_50px_rgba(79,70,229,0.12)]"
                alt="SkillLink Network Map" 
              />
            </div>

            {/* Floating Chat card (absolute positioned top-right) */}
            <div className="chat-card absolute top-4 right-0 w-[180px] sm:w-[220px] bg-white/95 dark:bg-slate-800/95 border border-indigo-100/40 dark:border-slate-700/40 backdrop-blur-md rounded-2xl p-4 shadow-2xl animate-float-fast hover:scale-105 transition-transform duration-300 z-20">
              <div className="flex items-center justify-between mb-3 border-b border-gray-100 dark:border-slate-700 pb-2">
                <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  Live Chat <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                </span>
                <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded font-bold">Recruiter ✓</span>
              </div>
              <div className="bg-gray-50 dark:bg-slate-900 rounded-xl p-1 overflow-hidden">
                <img 
                  src={chatCommunicationImg} 
                  className="w-full h-auto object-cover rounded-lg"
                  alt="Live chat visual" 
                />
              </div>
            </div>

            {/* Badge A: AI Matching (Top-Left) */}
            <div className="absolute top-12 left-0 sm:left-4 bg-white/95 dark:bg-slate-800/95 border border-indigo-100/40 dark:border-slate-700/40 backdrop-blur-md rounded-xl p-3 shadow-xl flex items-center gap-3 animate-float hover:scale-105 transition-transform duration-300 z-20">
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-black text-sm border border-emerald-100 dark:border-emerald-900/50 shadow-inner">
                95%
              </div>
              <div>
                <span className="block text-[9px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-wider leading-none">AI Matching</span>
                <span className="text-xs font-black text-gray-900 dark:text-white">Profile Score</span>
              </div>
            </div>

            {/* Badge B: Active Jobs (Bottom-Left) */}
            <div className="absolute bottom-6 left-0 sm:left-6 bg-white/95 dark:bg-slate-800/95 border border-indigo-100/40 dark:border-slate-700/40 backdrop-blur-md rounded-xl p-3 shadow-xl flex items-center gap-3 animate-float-slow hover:scale-105 transition-transform duration-300 z-20">
              <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 shadow-inner">
                <Briefcase size={18} />
              </div>
              <div>
                <span className="block text-[9px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-wider leading-none">Active Board</span>
                <span className="text-xs font-black text-gray-900 dark:text-white">500+ Jobs</span>
              </div>
            </div>

            {/* Badge C: Online Network Status (Bottom-Right) */}
            <div className="absolute -bottom-2 right-4 sm:right-12 bg-white/95 dark:bg-slate-800/95 border border-indigo-100/40 dark:border-slate-700/40 backdrop-blur-md rounded-xl p-3 shadow-xl flex items-center gap-3 animate-float hover:scale-105 transition-transform duration-300 z-20">
              <div className="w-10 h-10 rounded-full bg-pink-50 dark:bg-pink-950/30 flex items-center justify-center text-pink-600 dark:text-pink-400 border border-pink-100 dark:border-pink-900/30 shadow-inner">
                <MessageCircle size={18} />
              </div>
              <div>
                <span className="block text-[9px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-wider leading-none">Smart Networking</span>
                <span className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-1">
                  Mentors Live <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                </span>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-md py-24 border-t border-indigo-50/40 dark:border-slate-800/40 transition-colors z-10">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white sm:text-4xl tracking-tight">Everything you need to grow your career</h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Discover all the tools SkillLink provides to help you succeed.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <div className="bg-white/80 dark:bg-slate-800/60 rounded-3xl p-8 hover:shadow-xl hover:border-indigo-100 dark:hover:border-indigo-900/30 hover:-translate-y-1.5 border border-transparent dark:border-slate-800/40 transition-all duration-300 backdrop-blur-sm group">
              <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/50 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 shadow-inner group-hover:scale-110 transition-transform duration-300 border border-indigo-100/50 dark:border-indigo-950/20">
                <Target size={26} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">AI Job Matching</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                Our recommendation engine analyzes your skills and resume to find the perfect job opportunities tailored just for you.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white/80 dark:bg-slate-800/60 rounded-3xl p-8 hover:shadow-xl hover:border-indigo-100 dark:hover:border-indigo-900/30 hover:-translate-y-1.5 border border-transparent dark:border-slate-800/40 transition-all duration-300 backdrop-blur-sm group">
              <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/50 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 shadow-inner group-hover:scale-110 transition-transform duration-300 border border-indigo-100/50 dark:border-indigo-950/20">
                <MessageSquare size={26} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Smart Networking</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                Connect with professionals, join niche groups, and utilize our AI Smart Replies to keep conversations flowing seamlessly.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white/80 dark:bg-slate-800/60 rounded-3xl p-8 hover:shadow-xl hover:border-indigo-100 dark:hover:border-indigo-900/30 hover:-translate-y-1.5 border border-transparent dark:border-slate-800/40 transition-all duration-300 backdrop-blur-sm group">
              <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/50 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 shadow-inner group-hover:scale-110 transition-transform duration-300 border border-indigo-100/50 dark:border-indigo-950/20">
                <TrendingUp size={26} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Career Growth</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                Build your professional portfolio, track your applications, and unlock personalized insights to accelerate your success.
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* Premium CTA Section */}
      <div className="relative py-20 overflow-hidden z-10">
        <div className="max-w-5xl mx-auto px-6">
          <div className="relative rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 dark:from-indigo-900/40 dark:to-purple-950/40 p-12 sm:p-16 text-center shadow-2xl border border-indigo-500/20 dark:border-indigo-500/10 overflow-hidden backdrop-blur-md">
            
            {/* CTA Background glows */}
            <div className="absolute top-0 right-0 w-[350px] h-[350px] rounded-full bg-pink-500/20 filter blur-3xl pointer-events-none z-0 translate-x-1/3 -translate-y-1/3"></div>
            <div className="absolute bottom-0 left-0 w-[350px] h-[350px] rounded-full bg-indigo-500/20 filter blur-3xl pointer-events-none z-0 -translate-x-1/3 translate-y-1/3"></div>
            
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
                Ready to accelerate your career?
              </h2>
              <p className="text-lg text-indigo-100 mb-8 leading-relaxed">
                Join thousands of students and professionals on SkillLink. Leverage AI job matching, connect with top mentors, and land your dream role today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  to={isAuthenticated ? "/explore" : "/register"}
                  className="px-8 py-4 bg-white text-indigo-600 hover:bg-indigo-50 font-bold rounded-xl shadow-lg transition-all duration-300 w-full sm:w-auto text-center hover:scale-105 active:scale-95"
                >
                  Join SkillLink Now
                </Link>
                <Link
                  to={isAuthenticated ? "/jobs" : "/login"}
                  className="px-8 py-4 bg-indigo-700/50 hover:bg-indigo-700/70 border border-indigo-400/30 text-white font-bold rounded-xl transition-all duration-300 w-full sm:w-auto text-center hover:scale-105 active:scale-95"
                >
                  Explore Jobs
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

