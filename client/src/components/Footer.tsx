import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mail, Zap, ArrowUp } from 'lucide-react';
import { FaTwitter, FaLinkedin, FaGithub, FaInstagram } from 'react-icons/fa';
import DotField from './DotField';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkTheme();
    
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    
    return () => observer.disconnect();
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      alert(`Subscribed with ${email}!`);
      setEmail('');
    }
  };

  const handleLinkClick = (path: string) => {
    if (location.pathname === path) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (location.pathname.startsWith('/chat')) {
    return null;
  }

  return (
    <footer className="bg-gray-50 dark:bg-slate-950 text-gray-600 dark:text-gray-300 py-16 border-t border-gray-200 dark:border-slate-800 font-sans relative overflow-hidden mt-auto transition-colors duration-300">
      {/* DotField Dynamic Background */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none select-none overflow-hidden opacity-60">
        <DotField
          dotRadius={2}
          dotSpacing={19}
          bulgeStrength={67}
          glowRadius={130}
          sparkle
          waveAmplitude={0}
          cursorRadius={100}
          cursorForce={0.1}
          bulgeOnly
          gradientFrom={isDark ? "#080946" : "#a5b4fc"}
          gradientTo={isDark ? "#7b79db" : "#e0e7ff"}
          glowColor={isDark ? "#120F17" : "#f8fafc"}
        />
      </div>

      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-indigo-600/10 dark:bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Newsletter Section */}
        <div className="flex flex-col items-center text-center mb-20">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 transition-colors">
            Continue Your <span className="text-indigo-600 dark:text-indigo-500">Success Story</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mb-8 transition-colors">
            Join 10,000+ professionals who get weekly insights on networking, career growth, and industry trends. Be the first to know about new opportunities.
          </p>
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row w-full max-w-md gap-3 relative">
            <input 
              type="email" 
              id="newsletter-email"
              name="newsletterEmail"
              placeholder="your@email.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white dark:bg-slate-900/80 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white px-5 py-3 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors placeholder-gray-400 dark:placeholder-gray-500 shadow-sm dark:shadow-none"
              required
            />
            <button 
              type="submit" 
              className="sm:absolute sm:right-1.5 sm:top-1.5 sm:bottom-1.5 w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 sm:py-0 rounded-lg transition-colors flex justify-center items-center gap-2"
            >
              Subscribe
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-4">No spam, just career growth. Unsubscribe anytime.</p>
        </div>

        <div className="border-t border-gray-200 dark:border-slate-800 mb-12 transition-colors"></div>

        {/* Main Footer Links */}
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-8 mb-16">
          
          {/* Brand Section */}
          <div className="w-full lg:w-[30%] shrink-0 flex flex-col items-center xs:items-start text-center xs:text-left">
            <Link to="/" onClick={() => handleLinkClick("/")} className="flex items-center gap-2 mb-4 justify-center xs:justify-start">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <Zap size={24} className="text-white" fill="currentColor" />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight transition-colors">SkillLink</span>
            </Link>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm leading-relaxed transition-colors">
              Empowering professionals to connect, grow, and succeed. Your professional network starts here.
            </p>
            <div className="flex items-center gap-4 justify-center xs:justify-start">
              <a href="#" className="w-10 h-10 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full flex items-center justify-center text-gray-400 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white hover:bg-indigo-50 dark:hover:bg-indigo-600 hover:border-indigo-200 dark:hover:border-indigo-600 transition-all shadow-sm dark:shadow-none">
                <FaTwitter size={18} />
              </a>
              <a href="#" className="w-10 h-10 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full flex items-center justify-center text-gray-400 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white hover:bg-indigo-50 dark:hover:bg-indigo-600 hover:border-indigo-200 dark:hover:border-indigo-600 transition-all shadow-sm dark:shadow-none">
                <FaLinkedin size={18} />
              </a>
              <a href="#" className="w-10 h-10 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full flex items-center justify-center text-gray-400 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white hover:bg-indigo-50 dark:hover:bg-indigo-600 hover:border-indigo-200 dark:hover:border-indigo-600 transition-all shadow-sm dark:shadow-none">
                <FaGithub size={18} />
              </a>
              <a href="#" className="w-10 h-10 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full flex items-center justify-center text-gray-400 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white hover:bg-indigo-50 dark:hover:bg-indigo-600 hover:border-indigo-200 dark:hover:border-indigo-600 transition-all shadow-sm dark:shadow-none">
                <FaInstagram size={18} />
              </a>
            </div>
          </div>

          {/* Links Columns container */}
          <div className="w-full lg:w-[70%] grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 lg:grid-cols-[1fr_1fr_1fr_auto] xl:grid-cols-4 gap-y-10 gap-x-4 xs:gap-x-6 md:gap-x-8 lg:gap-x-6 xl:gap-x-8">
            {/* Quick Links */}
            <div className="text-center xs:text-left">
              <h3 className="text-gray-900 dark:text-white font-semibold mb-6 transition-colors text-center xs:text-left">Quick Links</h3>
              <ul className="space-y-4 text-sm font-medium">
                <li><Link to="/" onClick={() => handleLinkClick("/")} className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Home</Link></li>
                <li><Link to="/explore" onClick={() => handleLinkClick("/explore")} className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Explore</Link></li>
                <li><Link to="/jobs" onClick={() => handleLinkClick("/jobs")} className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Jobs</Link></li>
                <li><Link to="/groups" onClick={() => handleLinkClick("/groups")} className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Groups</Link></li>
                <li><Link to="/chat" onClick={() => handleLinkClick("/chat")} className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Messages</Link></li>
                <li><Link to="/network" onClick={() => handleLinkClick("/network")} className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Network</Link></li>
                <li><Link to="/profile" onClick={() => handleLinkClick("/profile")} className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Profile</Link></li>
              </ul>
            </div>

            {/* Features */}
            <div className="text-center xs:text-left">
              <h3 className="text-gray-900 dark:text-white font-semibold mb-6 transition-colors text-center xs:text-left">Features</h3>
              <ul className="space-y-4 text-sm font-medium">
                <li><Link to="/jobs" onClick={() => handleLinkClick("/jobs")} className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Job Recommendations</Link></li>
                <li><Link to="/chat" onClick={() => handleLinkClick("/chat")} className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Real-Time Chat</Link></li>
                <li><Link to="/explore" onClick={() => handleLinkClick("/explore")} className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">AI Matching</Link></li>
                <li><Link to="/profile" onClick={() => handleLinkClick("/profile")} className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Resume Upload</Link></li>
                <li><Link to="/groups" onClick={() => handleLinkClick("/groups")} className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Professional Groups</Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div className="text-center xs:text-left">
              <h3 className="text-gray-900 dark:text-white font-semibold mb-6 transition-colors text-center xs:text-left">Resources</h3>
              <ul className="space-y-4 text-sm font-medium">
                <li><Link to="/" onClick={() => handleLinkClick("/")} className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Help Center</Link></li>
                <li><Link to="/privacy-policy" onClick={() => handleLinkClick("/privacy-policy")} className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms-of-service" onClick={() => handleLinkClick("/terms-of-service")} className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Terms of Service</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div className="text-center xs:text-left">
              <h3 className="text-gray-900 dark:text-white font-semibold mb-6 transition-colors text-center xs:text-left">Contact</h3>
              <div className="space-y-4 flex flex-col items-center xs:items-start">
                <a href="mailto:support@skilllink.com" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white transition-colors text-[10px] min-[320px]:text-xs min-[380px]:text-sm md:text-xs lg:text-xs xl:text-sm font-medium whitespace-nowrap justify-center xs:justify-start w-full">
                  <Mail size={16} className="shrink-0" /> support@skilllink.com
                </a>
                <p className="text-gray-600 dark:text-gray-400 text-xs min-[380px]:text-sm font-medium">Ahmedabad, India</p>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 border-t border-gray-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500 font-medium transition-colors">
          <p>© {new Date().getFullYear()} SkillLink. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link to="/privacy-policy" onClick={() => handleLinkClick("/privacy-policy")} className="hover:text-gray-900 dark:hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms-of-service" onClick={() => handleLinkClick("/terms-of-service")} className="hover:text-gray-900 dark:hover:text-white transition-colors">Terms of Service</Link>
            <Link to="/cookie-policy" onClick={() => handleLinkClick("/cookie-policy")} className="hover:text-gray-900 dark:hover:text-white transition-colors">Cookie Policy</Link>
          </div>
        </div>

      </div>

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-white/90 dark:bg-slate-900/90 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-slate-800 shadow-lg hover:shadow-indigo-500/20 hover:text-indigo-600 dark:hover:text-indigo-400 hover:-translate-y-1 active:scale-95 transition-all duration-300 backdrop-blur-sm group focus:outline-none"
        >
          <ArrowUp size={20} className="group-hover:animate-bounce shrink-0" />
        </button>
      )}
    </footer>
  );
};

export default Footer;
