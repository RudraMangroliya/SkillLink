import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";
import { Target, MessageSquare, TrendingUp, Briefcase } from "lucide-react";
import SEO from "../components/SEO";
import SplitText from "../components/SplitText";
import CountUp from "../components/CountUp";
import Antigravity from "../components/Antigravity";
import BorderGlow from "../components/BorderGlow";

// Custom visual assets
import networkMapImg from "../assets/network_map.png";
import chatCommunicationImg from "../assets/chat_communication.png";

export default function LandingPage() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [showCanvas, setShowCanvas] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Detect mobile/tablet screens or touch capability to protect low-RAM phones and preserve battery
    const isMobile = 
      window.innerWidth < 768 || 
      ('ontouchstart' in window) || 
      navigator.maxTouchPoints > 0;

    // Detect low-RAM devices to prevent WebGL overhead
    const isLowMemory = 
      (navigator as any).deviceMemory !== undefined && 
      (navigator as any).deviceMemory < 4;

    if (!isMobile && !isLowMemory) {
      // Delay WebGL mounting to ensure immediate, lag-free initial text/image rendering (animations finished)
      const timer = setTimeout(() => {
        setShowCanvas(true);
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    // Dynamic theme mutation listener to adapt particles on active toggling
    const checkTheme = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };
    checkTheme();
    
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden bg-gradient-to-br from-slate-50 via-slate-50 to-indigo-50/20 dark:from-[#0b1121] dark:via-[#0f172a] dark:to-[#111827] tech-grid-bg transition-colors duration-500">
      <SEO 
        title="AI-Powered Professional Networking & Job Matching" 
        description="Connect with mentors, find AI-matched jobs, join groups, and accelerate your career growth on SkillLink, the leading professional ecosystem."
      />

      {/* Premium WebGL Antigravity Particle Background Overlay (100% Click-Through Proof) */}
      <div 
        className={`absolute inset-0 w-full h-[650px] min-[480px]:h-[750px] sm:h-[850px] lg:h-full z-0 pointer-events-none select-none overflow-hidden transition-all duration-1000 ease-in-out ${
          showCanvas ? (isDarkMode ? "opacity-[0.35]" : "opacity-[0.15]") : "opacity-0"
        }`}
      >
        {showCanvas && (
          <Antigravity
            count={600}
            magnetRadius={3.5}
            ringRadius={4.0}
            waveSpeed={0.4}
            waveAmplitude={1}
            particleSize={1.0}
            lerpSpeed={0.05}
            color={isDarkMode ? "#818CF8" : "#4F46E5"}
            autoAnimate
            particleVariance={1}
            rotationSpeed={0}
            depthFactor={1}
            pulseSpeed={3}
            particleShape="capsule"
            fieldStrength={10}
          />
        )}
      </div>



      {/* Hero Section */}
      <div className="relative flex-grow flex items-center justify-center z-10 w-full">
        <div className="w-full max-w-7xl mx-auto px-3 min-[360px]:px-6 sm:px-8 lg:px-12 py-10 min-[360px]:py-16 sm:py-20 lg:py-28 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
          
          {/* Left Column: Text & Calls to Action */}
          <div className="lg:col-span-5 text-left flex flex-col justify-center animate-fade-in-slide w-full">

            {/* Premium Heading */}
            <h1 className="text-2xl min-[320px]:text-3xl min-[400px]:text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white tracking-tight leading-tight mb-4 sm:mb-6 break-words flex flex-col items-start select-text">
              <SplitText
                text="Connect."
                className="font-black text-gray-900 dark:text-white leading-tight"
                delay={40}
                startDelay={0}
                duration={0.8}
                ease="power3.out"
                splitType="chars"
                from={{ opacity: 0, y: 30 }}
                to={{ opacity: 1, y: 0 }}
                threshold={0.1}
                tag="span"
                textAlign="left"
              />
              <SplitText
                text="Network."
                className="font-black text-gray-900 dark:text-white leading-tight"
                delay={40}
                startDelay={0.35}
                duration={0.8}
                ease="power3.out"
                splitType="chars"
                from={{ opacity: 0, y: 30 }}
                to={{ opacity: 1, y: 0 }}
                threshold={0.1}
                tag="span"
                textAlign="left"
              />
              <SplitText
                text="Get Hired."
                className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 text-gradient-shimmer font-black leading-tight"
                delay={40}
                startDelay={0.7}
                duration={0.8}
                ease="power3.out"
                splitType="none"
                from={{ opacity: 0, y: 30 }}
                to={{ opacity: 1, y: 0 }}
                threshold={0.1}
                tag="span"
                textAlign="left"
              />
            </h1>

            {/* Premium Subtitle - cascading entrance delay */}
            <p 
              style={{ animationDelay: "950ms", animationFillMode: "both" }}
              className="text-xs min-[360px]:text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-6 sm:mb-8 max-w-xl animate-fade-in-slide"
            >
              SkillLink uses AI-powered matching, real-time messaging, and professional networking to connect talent with opportunity.
            </p>

            {/* CTA Buttons - cascading entrance delay */}
            <div 
              style={{ animationDelay: "1150ms", animationFillMode: "both" }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 sm:mb-10 w-full animate-fade-in-slide"
            >
              <Link
                to={isAuthenticated ? "/explore" : "/login"}
                className="px-4 py-2.5 min-[360px]:px-6 min-[360px]:py-3.5 sm:px-8 sm:py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 hover:-translate-y-0.5 active:scale-95 transition-all duration-300 text-center w-full sm:w-auto text-xs min-[360px]:text-sm cursor-pointer"
              >
                {isAuthenticated ? "Go to Dashboard" : "Get Started"}
              </Link>
              <button 
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-4 py-2.5 min-[360px]:px-6 min-[360px]:py-3.5 sm:px-8 sm:py-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-indigo-600 dark:text-indigo-400 font-bold rounded-xl shadow-md border border-indigo-100/50 dark:border-slate-700/50 hover:bg-indigo-50/50 dark:hover:bg-slate-700/50 hover:-translate-y-0.5 active:scale-95 transition-all duration-300 text-center w-full sm:w-auto text-xs min-[360px]:text-sm cursor-pointer"
              >
                Explore Features
              </button>
            </div>

            {/* Grid Metrics - cascading entrance delay */}
            <div 
              style={{ animationDelay: "1350ms", animationFillMode: "both" }}
              className="border-t border-indigo-100/50 dark:border-slate-800/50 pt-6 grid grid-cols-3 gap-2 min-[360px]:gap-4 md:gap-8 w-full animate-fade-in-slide"
            >
              <div className="text-left">
                <span className="block text-base min-[300px]:text-lg min-[360px]:text-xl sm:text-2xl md:text-3xl font-black text-indigo-600 dark:text-indigo-400 leading-none mb-1">
                  <CountUp from={0} to={10} duration={1.5} delay={1.4} />K+
                </span>
                <span className="block text-[7px] min-[300px]:text-[8px] min-[360px]:text-[9px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold leading-tight">Active Users</span>
              </div>
              <div className="border-l border-indigo-100/50 dark:border-slate-800/50 pl-2 min-[300px]:pl-3 sm:pl-6 text-left">
                <span className="block text-base min-[300px]:text-lg min-[360px]:text-xl sm:text-2xl md:text-3xl font-black text-indigo-600 dark:text-indigo-400 leading-none mb-1">
                  <CountUp from={0} to={500} duration={1.5} delay={1.4} />+
                </span>
                <span className="block text-[7px] min-[300px]:text-[8px] min-[360px]:text-[9px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold leading-tight">Recruiters</span>
              </div>
              <div className="border-l border-indigo-100/50 dark:border-slate-800/50 pl-2 min-[300px]:pl-3 sm:pl-6 text-left">
                <span className="block text-base min-[300px]:text-lg min-[360px]:text-xl sm:text-2xl md:text-3xl font-black text-indigo-600 dark:text-indigo-400 leading-none mb-1">
                  <CountUp from={0} to={2} duration={1.5} delay={1.4} />K+
                </span>
                <span className="block text-[7px] min-[300px]:text-[8px] min-[360px]:text-[9px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold leading-tight">Jobs Added</span>
              </div>
            </div>

          </div>

          {/* Right Column: Centerpiece Map & Floating Visual Elements */}
          <div className="lg:col-span-7 flex justify-center items-center relative mt-6 sm:mt-10 lg:mt-0 select-none animate-fade-in-slide delay-200 w-full overflow-visible">
            
            {/* The Self-Sizing Network Map & Badges Container */}
            <div className="relative max-w-[280px] min-[360px]:max-w-[340px] min-[480px]:max-w-[450px] sm:max-w-[550px] lg:max-w-[650px] w-full mx-auto animate-float flex justify-center items-center overflow-visible">
              
              {/* Refined professional high-contrast glow backdrop to ensure connecting lines are perfectly visible in light mode */}
              <div className="absolute w-[100%] h-[80%] rounded-full bg-gradient-to-tr from-indigo-600/4 via-purple-600/4 to-indigo-950/4 filter blur-2xl z-0 pointer-events-none block dark:hidden"></div>
              <div className="absolute w-[60%] h-[60%] rounded-full bg-indigo-950/12 filter blur-3xl z-0 pointer-events-none block dark:hidden"></div>
              
              {/* The Main Network Map Image */}
              <img 
                src={networkMapImg} 
                className="w-full h-auto object-contain filter drop-shadow-[0_20px_40px_rgba(79,70,229,0.15)] dark:drop-shadow-[0_25px_50px_rgba(79,70,229,0.25)] brightness-95 contrast-105 saturate-110 dark:brightness-100 dark:contrast-100 dark:saturate-100 relative z-10"
                alt="SkillLink Network Map" 
              />

              {/* Floating Chat card (absolute positioned relative to the self-sizing container) */}
              <div className="chat-card absolute top-4 right-[-15px] sm:right-[-30px] lg:right-[-50px] w-[100px] min-[360px]:w-[130px] min-[480px]:w-[170px] sm:w-[210px] bg-white/95 dark:bg-slate-800/95 border border-indigo-100/40 dark:border-slate-700/40 backdrop-blur-md rounded-xl sm:rounded-2xl p-1.5 sm:p-3.5 shadow-2xl animate-float-fast hover:scale-105 transition-transform duration-300 z-20 hidden min-[280px]:block">
                <div className="flex items-center justify-between mb-1.5 sm:mb-2.5 border-b border-gray-100 dark:border-slate-700/60 pb-1.5 sm:pb-2">
                  <span className="text-[7px] min-[360px]:text-[10px] sm:text-xs font-black text-gray-900 dark:text-white flex items-center gap-1">
                    Live Chat <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  </span>
                  <span className="text-[6px] min-[360px]:text-[9px] bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 px-1 sm:px-1.5 py-0.5 rounded font-black uppercase tracking-wider scale-90 sm:scale-100">Recruiter</span>
                </div>
                <div className="bg-gray-50 dark:bg-slate-900/60 rounded-lg sm:rounded-xl p-0.5 sm:p-1 border border-gray-100/30 dark:border-slate-800/30 overflow-hidden shadow-inner">
                  <img 
                    src={chatCommunicationImg} 
                    className="w-full h-auto object-cover rounded-md sm:rounded-lg scale-[1.45] origin-center"
                    alt="Live chat visual" 
                  />
                </div>
              </div>

              {/* Badge A: AI Matching (Top-Left, tracked perfectly) */}
              {/* <div className="absolute top-10 left-[-15px] sm:left-[-30px] lg:left-[-50px] bg-white/95 dark:bg-slate-800/95 border border-indigo-100/40 dark:border-slate-700/40 backdrop-blur-md rounded-xl p-2 sm:p-3 shadow-xl flex items-center gap-2 sm:gap-3 animate-float hover:scale-105 transition-transform duration-300 z-20 hidden min-[480px]:flex">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-black text-xs sm:text-sm border border-emerald-100 dark:border-emerald-900/50 shadow-inner">
                  95%
                </div>
                <div>
                  <span className="block text-[8px] sm:text-[9px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-wider leading-none">AI Matching</span>
                  <span className="text-[10px] sm:text-xs font-black text-gray-900 dark:text-white">Profile Score</span>
                </div>
              </div> */}

              {/* Badge B: Job Match Alert (Bottom-Left, perfectly aligned & visually balanced) */}
              {/* <div className="absolute bottom-10 left-[-15px] sm:left-[-30px] lg:left-[-50px] bg-white/95 dark:bg-slate-800/95 border border-indigo-100/40 dark:border-slate-700/40 backdrop-blur-md rounded-xl p-2.5 sm:p-3.5 shadow-xl flex items-center gap-2 sm:gap-3.5 animate-float-slow hover:scale-105 transition-transform duration-300 z-20 hidden min-[480px]:flex">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 shadow-inner">
                  <Briefcase size={18} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <span className="block text-[8px] sm:text-[9px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-wider leading-none">New Job Match</span>
                  <span className="text-[10px] sm:text-xs font-black text-gray-900 dark:text-white">AI Engineer at Google</span>
                </div>
              </div> */}

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
            <BorderGlow borderRadius={24} className="group hover:-translate-y-1.5 transition-transform duration-300 cursor-default">
              <div className="p-6 sm:p-8">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-50 dark:bg-indigo-950/50 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 sm:mb-6 shadow-inner group-hover:scale-110 transition-transform duration-300 border border-indigo-100/50 dark:border-indigo-950/20">
                  <Target size={22} className="sm:w-[26px] sm:h-[26px]" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">AI Job Matching</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-xs sm:text-sm">
                  Our recommendation engine analyzes your skills and resume to find the perfect job opportunities tailored just for you.
                </p>
              </div>
            </BorderGlow>

            {/* Feature 2 */}
            <BorderGlow borderRadius={24} className="group hover:-translate-y-1.5 transition-transform duration-300 cursor-default">
              <div className="p-6 sm:p-8">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-50 dark:bg-indigo-950/50 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 sm:mb-6 shadow-inner group-hover:scale-110 transition-transform duration-300 border border-indigo-100/50 dark:border-indigo-950/20">
                  <MessageSquare size={22} className="sm:w-[26px] sm:h-[26px]" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">Smart Networking</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-xs sm:text-sm">
                  Connect with professionals, join niche groups, and utilize our AI Smart Replies to keep conversations flowing seamlessly.
                </p>
              </div>
            </BorderGlow>

            {/* Feature 3 */}
            <BorderGlow borderRadius={24} className="group hover:-translate-y-1.5 transition-transform duration-300 cursor-default">
              <div className="p-6 sm:p-8">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-50 dark:bg-indigo-950/50 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 sm:mb-6 shadow-inner group-hover:scale-110 transition-transform duration-300 border border-indigo-100/50 dark:border-indigo-950/20">
                  <TrendingUp size={22} className="sm:w-[26px] sm:h-[26px]" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">Career Growth</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-xs sm:text-sm">
                  Build your professional portfolio, track your applications, and unlock personalized insights to accelerate your success.
                </p>
              </div>
            </BorderGlow>

          </div>
        </div>
      </div>

    </div>
  );
}


