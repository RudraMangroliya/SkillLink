import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "./store/store";
import { useEffect, useState, lazy, Suspense } from "react";
import axiosInstance from "./utils/axios";
import { setProfileComplete } from "./store/slices/authSlice";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import { ThemeProvider } from "./contexts/ThemeContext";
import PageLoader from "./components/PageLoader";

const LandingPage = lazy(() => import("./pages/LandingPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
import ProfilePage from "./pages/ProfilePage";
const JobBoardPage = lazy(() => import("./pages/JobBoardPage"));
const ExplorePage = lazy(() => import("./pages/ExplorePage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const NetworkPage = lazy(() => import("./pages/NetworkPage"));
const GroupsPage = lazy(() => import("./pages/GroupsPage"));
const GroupDetailsPage = lazy(() => import("./pages/GroupDetailsPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const TermsOfServicePage = lazy(() => import("./pages/TermsOfServicePage"));
const CookiePolicyPage = lazy(() => import("./pages/CookiePolicyPage"));

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const RequireProfile = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, profileComplete } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(profileComplete === null);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (profileComplete !== null) {
      setLoading(false);
    }
  }, [isAuthenticated, profileComplete]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading profile...</div>;
  if (profileComplete === false) return <Navigate to="/onboarding" replace />;
  
  return children;
};

function App() {
  const { isAuthenticated, profileComplete } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    if (isAuthenticated && profileComplete === null) {
      axiosInstance.get("/api/profile")
        .then((res) => {
          if (res.data && res.data.profileCompletionScore > 0) {
            dispatch(setProfileComplete(true));
          } else {
            dispatch(setProfileComplete(false));
          }
        })
        .catch((error) => {
          if (error.response && error.response.status === 404) {
            // Only set to false (redirects to onboarding) if explicitly 404
            dispatch(setProfileComplete(false));
          } else if (error.response && error.response.status === 401) {
            // Interceptor handles logout, do nothing here
          } else {
            // Network error or 500
            console.error("Failed to fetch profile:", error);
            // Don't redirect to onboarding. Instead, you might want to log them out or just show an error toast.
            // For now, we'll wait for the network to recover or let them refresh.
          }
        });
    }
  }, [isAuthenticated, profileComplete, dispatch]);

  return (
    <ThemeProvider>
      <Router>
        <ScrollToTop />
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
        <Navbar />
        <main className="flex-grow overflow-x-hidden">
          <Suspense fallback={<PageLoader fullPage={true} />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/profile" element={
          <RequireProfile>
            <ProfilePage />
          </RequireProfile>
        } />
        <Route path="/profile/:userId" element={
          <RequireProfile>
            <ProfilePage />
          </RequireProfile>
        } />
        <Route path="/jobs" element={
          <RequireProfile>
            <JobBoardPage />
          </RequireProfile>
        } />
        <Route path="/explore" element={
          <RequireProfile>
            <ExplorePage />
          </RequireProfile>
        } />
        <Route path="/chat" element={
          <RequireProfile>
            <ChatPage />
          </RequireProfile>
        } />
        <Route path="/admin" element={
          <RequireProfile>
            <AdminDashboard />
          </RequireProfile>
        } />
        <Route path="/onboarding" element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        } />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/network" element={
          <RequireProfile>
            <NetworkPage />
          </RequireProfile>
        } />
        <Route path="/groups" element={
          <RequireProfile>
            <GroupsPage />
          </RequireProfile>
        } />
        <Route path="/groups/:id" element={
          <RequireProfile>
            <GroupDetailsPage />
          </RequireProfile>
        } />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms-of-service" element={<TermsOfServicePage />} />
        <Route path="/cookie-policy" element={<CookiePolicyPage />} />
        
          {/* Catch-all route for unknown pages */}
          <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
          </main>
          <Footer />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
