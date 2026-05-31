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
    <div className="min-h-screen flex flex-col relative overflow-x-hidden bg-gradient-to-br from-[#f8faff] via-[#eef2ff] to-[#e0e7ff] dark:from-[#0b1121] dark:via-[#0f172a] dark:to-[#1e1b4b] transition-colors duration-500">
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
      <div className="relative flex-grow flex items-center justify-center z-10 w-full">
        <div className="w-full max-w-7xl mx-auto px-3 min-[360px]:px-6 sm:px-8 lg:px-12 py-10 min-[360px]:py-16 sm:py-20 lg:py-28 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
          
          {/* Left Column: Text & Calls to Action */}
          <div className="lg:col-span-5 text-left flex flex-col justify-center animate-fade-in-slide w-full">

            {/* Premium Heading */}
            <h1 className="text-2xl min-[320px]:text-3xl min-[400px]:text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white tracking-tight leading-tight mb-4 sm:mb-6 break-words">
              Connect. Network.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400">
                Get Hired.
              </span>
            </h1>

            {/* Premium Subtitle */}
            <p className="text-xs min-[360px]:text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-6 sm:mb-8 max-w-xl">
              SkillLink uses AI-powered matching, real-time messaging, and professional networking to connect talent with opportunity.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 sm:mb-10 w-full">
              <Link
                to={isAuthenticated ? "/explore" : "/login"}
                className="px-4 py-2.5 min-[360px]:px-6 min-[360px]:py-3.5 sm:px-8 sm:py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 hover:-translate-y-0.5 active:scale-95 transition-all duration-300 text-center w-full sm:w-auto text-xs min-[360px]:text-sm animate-fade-in-slide"
              >
                {isAuthenticated ? "Go to Dashboard" : "Get Started"}
              </Link>
              <button 
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-4 py-2.5 min-[360px]:px-6 min-[360px]:py-3.5 sm:px-8 sm:py-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-indigo-600 dark:text-indigo-400 font-bold rounded-xl shadow-md border border-indigo-100/50 dark:border-slate-700/50 hover:bg-indigo-50/50 dark:hover:bg-slate-700/50 hover:-translate-y-0.5 active:scale-95 transition-all duration-300 text-center w-full sm:w-auto text-xs min-[360px]:text-sm cursor-pointer animate-fade-in-slide"
              >
                Explore Features
              </button>
            </div>

            {/* Grid Metrics */}
            <div className="border-t border-indigo-100/50 dark:border-slate-800/50 pt-6 grid grid-cols-3 gap-2 min-[360px]:gap-4 md:gap-8 w-full">
              <div className="text-left">
                <span className="block text-base min-[300px]:text-lg min-[360px]:text-xl sm:text-2xl md:text-3xl font-black text-indigo-600 dark:text-indigo-400 leading-none mb-1">10K+</span>
                <span className="block text-[7px] min-[300px]:text-[8px] min-[360px]:text-[9px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold leading-tight">Active Users</span>
              </div>
              <div className="border-l border-indigo-100/50 dark:border-slate-800/50 pl-2 min-[300px]:pl-3 sm:pl-6 text-left">
                <span className="block text-base min-[300px]:text-lg min-[360px]:text-xl sm:text-2xl md:text-3xl font-black text-indigo-600 dark:text-indigo-400 leading-none mb-1">500+</span>
                <span className="block text-[7px] min-[300px]:text-[8px] min-[360px]:text-[9px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold leading-tight">Recruiters</span>
              </div>
              <div className="border-l border-indigo-100/50 dark:border-slate-800/50 pl-2 min-[300px]:pl-3 sm:pl-6 text-left">
                <span className="block text-base min-[300px]:text-lg min-[360px]:text-xl sm:text-2xl md:text-3xl font-black text-indigo-600 dark:text-indigo-400 leading-none mb-1">2K+</span>
                <span className="block text-[7px] min-[300px]:text-[8px] min-[360px]:text-[9px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold leading-tight">Jobs Added</span>
              </div>
            </div>

          </div>

          {/* Right Column: Centerpiece Map & Floating Visual Elements */}
          <div className="lg:col-span-7 flex justify-center items-center relative mt-6 sm:mt-10 lg:mt-0 select-none animate-fade-in-slide delay-200 w-full overflow-visible">
            
            {/* The Main Network Map Image & Badges Container */}
            <div className="relative max-w-[280px] min-[360px]:max-w-[340px] min-[480px]:max-w-[450px] sm:max-w-[500px] lg:max-w-[600px] w-full animate-float select-none mx-auto">
              <div className="bg-white/40 dark:bg-slate-900/40 border border-white/50 dark:border-slate-800/80 p-3 sm:p-6 rounded-[24px] sm:rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.25)] backdrop-blur-sm overflow-visible relative flex items-center justify-center">
                
                <img 
                  src={networkMapImg} 
                  className="w-full h-auto object-contain mix-blend-multiply dark:mix-blend-normal dark:bg-white/95 dark:p-2 sm:dark:p-4 dark:rounded-2xl filter dark:drop-shadow-md"
                  alt="SkillLink Network Map" 
                />

                {/* Floating Chat card (absolute positioned relative to the map container for perfect tracking) */}
                <div className="chat-card absolute top-4 right-[-10px] sm:right-[-20px] lg:right-[-40px] w-[110px] min-[360px]:w-[140px] min-[480px]:w-[170px] sm:w-[210px] bg-white/95 dark:bg-slate-950/95 border border-indigo-100/40 dark:border-slate-800/60 backdrop-blur-md rounded-xl sm:rounded-2xl p-2 sm:p-3.5 shadow-[0_20px_40px_rgba(0,0,0,0.12)] animate-float-fast hover:scale-105 transition-transform duration-300 z-20 hidden min-[320px]:block">
                  <div className="flex items-center justify-between mb-1.5 sm:mb-2.5 border-b border-gray-100 dark:border-slate-800 pb-1.5 sm:pb-2">
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500"></span>
                      </span>
                      <span className="text-[8px] min-[360px]:text-xs font-bold text-gray-900 dark:text-white">Live Chat</span>
                    </div>
                    <span className="text-[7px] min-[360px]:text-[9px] bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-full font-bold border border-indigo-100/20 dark:border-indigo-900/30">Recruiter ✓</span>
                  </div>
                  <div className="bg-gradient-to-br from-indigo-50/40 to-violet-50/20 dark:from-slate-900 dark:to-slate-900/50 rounded-lg sm:rounded-xl p-0.5 sm:p-1.5 overflow-hidden border border-indigo-100/10 dark:border-slate-800/50">
                    <img 
                      src={chatCommunicationImg} 
                      className="w-full h-auto object-cover rounded-md sm:rounded-lg filter drop-shadow-sm"
                      alt="Live chat visual" 
                    />
                  </div>
                </div>

                {/* Badge A: AI Matching (Top-Left, relative to map container) */}
                <div className="absolute top-8 left-[-15px] sm:left-[-25px] lg:left-[-45px] bg-white/95 dark:bg-slate-950/95 border border-indigo-100/40 dark:border-slate-800/60 backdrop-blur-md rounded-xl p-2 sm:p-2.5 shadow-xl flex items-center gap-2 sm:gap-3 animate-float hover:scale-105 transition-transform duration-300 z-20 hidden min-[480px]:flex">
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-black text-[10px] sm:text-xs border border-emerald-100/50 dark:border-emerald-900/30 shadow-inner">
                    95%
                  </div>
                  <div>
                    <span className="block text-[8px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-wider leading-none">AI Matching</span>
                    <span className="text-[10px] font-black text-gray-900 dark:text-white">Profile Score</span>
                  </div>
                </div>

                {/* Badge B: Active Jobs (Bottom-Left, relative to map container) */}
                <div className="absolute bottom-6 left-[-15px] sm:left-2 lg:left-[-10px] bg-white/95 dark:bg-slate-950/95 border border-indigo-100/40 dark:border-slate-800/60 backdrop-blur-md rounded-xl p-2 sm:p-2.5 shadow-xl flex items-center gap-2 sm:gap-3 animate-float-slow hover:scale-105 transition-transform duration-300 z-20 hidden min-[480px]:flex">
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30 shadow-inner">
                    <Briefcase size={12} className="sm:w-[16px] sm:h-[16px]" />
                  </div>
                  <div>
                    <span className="block text-[8px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-wider leading-none">Active Board</span>
                    <span className="text-[10px] font-black text-gray-900 dark:text-white">500+ Jobs</span>
                  </div>
                </div>

                {/* Badge C: Online Network Status (Bottom-Right, relative to map container) */}
                <div className="absolute -bottom-4 right-2 sm:right-6 lg:right-0 bg-white/95 dark:bg-slate-950/95 border border-indigo-100/40 dark:border-slate-800/60 backdrop-blur-md rounded-xl p-2 sm:p-2.5 shadow-xl flex items-center gap-2 sm:gap-3 animate-float hover:scale-105 transition-transform duration-300 z-20 hidden min-[480px]:flex">
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-pink-50 dark:bg-pink-950/40 flex items-center justify-center text-pink-600 dark:text-pink-400 border border-pink-100/50 dark:border-pink-900/30 shadow-inner">
                    <MessageCircle size={12} className="sm:w-[16px] sm:h-[16px]" />
                  </div>
                  <div>
                    <span className="block text-[8px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-wider leading-none">Smart Networking</span>
                    <span className="text-[10px] font-black text-gray-900 dark:text-white flex items-center gap-1">
                      Mentors Live <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    </span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-md py-16 sm:py-24 border-t border-indigo-50/40 dark:border-slate-800/40 transition-colors z-10 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
          
          <div className="text-center mb-12 sm:mb-16 max-w-2xl mx-auto">
            <h2 className="text-2xl min-[360px]:text-3xl font-black text-gray-900 dark:text-white sm:text-4xl tracking-tight leading-tight">Everything you need to grow your career</h2>
            <p className="mt-3 text-sm sm:text-lg text-gray-600 dark:text-gray-400">Discover all the tools SkillLink provides to help you succeed.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            
            {/* Feature 1 */}
            <div className="bg-white/80 dark:bg-slate-800/60 rounded-3xl p-6 sm:p-8 hover:shadow-xl hover:border-indigo-100 dark:hover:border-indigo-900/30 hover:-translate-y-1.5 border border-transparent dark:border-slate-800/40 transition-all duration-300 backdrop-blur-sm group">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-50 dark:bg-indigo-950/50 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 sm:mb-6 shadow-inner group-hover:scale-110 transition-transform duration-300 border border-indigo-100/50 dark:border-indigo-950/20">
                <Target size={22} className="sm:w-[26px] sm:h-[26px]" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">AI Job Matching</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-xs sm:text-sm">
                Our recommendation engine analyzes your skills and resume to find the perfect job opportunities tailored just for you.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white/80 dark:bg-slate-800/60 rounded-3xl p-6 sm:p-8 hover:shadow-xl hover:border-indigo-100 dark:hover:border-indigo-900/30 hover:-translate-y-1.5 border border-transparent dark:border-slate-800/40 transition-all duration-300 backdrop-blur-sm group">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-50 dark:bg-indigo-950/50 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 sm:mb-6 shadow-inner group-hover:scale-110 transition-transform duration-300 border border-indigo-100/50 dark:border-indigo-950/20">
                <MessageSquare size={22} className="sm:w-[26px] sm:h-[26px]" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">Smart Networking</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-xs sm:text-sm">
                Connect with professionals, join niche groups, and utilize our AI Smart Replies to keep conversations flowing seamlessly.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white/80 dark:bg-slate-800/60 rounded-3xl p-6 sm:p-8 hover:shadow-xl hover:border-indigo-100 dark:hover:border-indigo-900/30 hover:-translate-y-1.5 border border-transparent dark:border-slate-800/40 transition-all duration-300 backdrop-blur-sm group">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-50 dark:bg-indigo-950/50 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 sm:mb-6 shadow-inner group-hover:scale-110 transition-transform duration-300 border border-indigo-100/50 dark:border-indigo-950/20">
                <TrendingUp size={22} className="sm:w-[26px] sm:h-[26px]" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">Career Growth</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-xs sm:text-sm">
                Build your professional portfolio, track your applications, and unlock personalized insights to accelerate your success.
              </p>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}

