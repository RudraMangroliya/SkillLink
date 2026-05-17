import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axiosInstance from "../utils/axios";
import { setCredentials, setProfileComplete } from "../store/slices/authSlice";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, token } = useSelector((state: any) => state.auth);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    headline: "",
    bio: "",
    location: "",
    skills: "",
    interests: "",
    educationInstitution: "",
    educationDegree: "",
    educationField: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => {
    setError("");
    if (step === 1 && (!formData.headline || !formData.location)) {
      setError("Headline and Location are required.");
      return;
    }
    if (step === 2 && !formData.bio) {
      setError("Bio is required.");
      return;
    }
    if (step === 3) {
      const skillsArray = formData.skills.split(",").map(s => s.trim()).filter(s => s);
      if (skillsArray.length < 3) {
        setError("Please enter at least 3 skills separated by commas.");
        return;
      }
    }
    if (step === 4 && (!formData.educationInstitution || !formData.educationDegree)) {
      setError("Latest education details are required.");
      return;
    }
    setStep((prev) => prev + 1);
  };

  const handleSubmit = async () => {
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      // 1. Update Profile Fields
      const profilePayload = {
        headline: formData.headline,
        location: formData.location,
        bio: formData.bio,
        skills: formData.skills.split(",").map(s => s.trim()).filter(s => s),
        interests: formData.interests.split(",").map(s => s.trim()).filter(s => s),
        education: [{
          institution: formData.educationInstitution,
          degree: formData.educationDegree,
          fieldOfStudy: formData.educationField,
        }]
      };

      await axiosInstance.post("/api/profile", profilePayload);

      // 2. Upload Profile Image
      if (profileImageFile) {
        const imageForm = new FormData();
        imageForm.append("image", profileImageFile);
        const imgRes = await axiosInstance.post("/api/profile/upload-image", imageForm, {
          headers: { "Content-Type": "multipart/form-data" }
        });

        // Update local user state with new image
        if (imgRes.data.profileImage) {
          dispatch(setCredentials({
            user: { ...user, profileImage: imgRes.data.profileImage },
            token
          }));
        }
      }

      // Resume upload removed from onboarding

      dispatch(setProfileComplete(true));
      navigate("/explore");
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to complete onboarding.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl p-8 border border-transparent dark:border-slate-700 transition-colors">

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            <span>Basic Info</span>
            <span>About</span>
            <span>Skills & Interests</span>
            <span>Education</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Complete Your Profile</h2>
          <p className="text-gray-500 dark:text-gray-400">Let's get you set up to connect with professionals.</p>
          {error && <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm">{error}</div>}
        </div>

        <div className="space-y-6">
          {step === 1 && (
            <div className="animate-fade-in text-gray-900 dark:text-white">
              <h3 className="text-xl font-semibold mb-4">Step 1: The Basics</h3>

              <div className="mb-4 flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-slate-700 mb-2 overflow-hidden flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-sm">
                  {profileImageFile ? (
                    <img src={URL.createObjectURL(profileImageFile)} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500 text-3xl">👤</span>
                  )}
                </div>
                <input type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => setProfileImageFile(e.target.files?.[0] || null)}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-800 dark:hover:text-indigo-300"
                >
                  Upload Profile Photo (Optional)
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Headline (Required)</label>
                <input type="text"
                  name="headline"
                  placeholder="e.g. Full Stack Developer | MERN Enthusiast"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                  value={formData.headline}
                  onChange={handleChange}
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location (Required)</label>
                <input type="text"
                  name="location"
                  placeholder="e.g. San Francisco, CA"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                  value={formData.location}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in text-gray-900 dark:text-white">
              <h3 className="text-xl font-semibold mb-4">Step 2: Tell Us About Yourself</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio (Required)</label>
                <textarea name="bio"
                  rows={5}
                  placeholder="Share a brief summary of your professional journey, goals, and what you're looking for..."
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-colors"
                  value={formData.bio}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in text-gray-900 dark:text-white">
              <h3 className="text-xl font-semibold mb-4">Step 3: Skills & Interests</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Skills (Required - Min 3, comma separated)</label>
                <input type="text"
                  name="skills"
                  placeholder="React, Node.js, Python, Leadership"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                  value={formData.skills}
                  onChange={handleChange}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">This helps us recommend the right connections and jobs.</p>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preferred Job Roles / Interests</label>
                <input type="text"
                  name="interests"
                  placeholder="Frontend Development, Mentorship, Open Source"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                  value={formData.interests}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="animate-fade-in text-gray-900 dark:text-white">
              <h3 className="text-xl font-semibold mb-4">Step 4: Latest Education</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Institution (Required)</label>
                <input type="text"
                  name="educationInstitution"
                  placeholder="University of Tech"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                  value={formData.educationInstitution}
                  onChange={handleChange}
                />
              </div>
              <div className="mt-4 flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Degree (Required)</label>
                  <input type="text"
                    name="educationDegree"
                    placeholder="B.Sc."
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                    value={formData.educationDegree}
                    onChange={handleChange}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Field of Study</label>
                  <input type="text"
                    name="educationField"
                    placeholder="Computer Science"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                    value={formData.educationField}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          )}



        </div>

        <div className="mt-10 flex justify-between">
          {step > 1 ? (
            <button
              onClick={() => { setError(""); setStep(step - 1); }}
              className="px-6 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition"
            >
              Back
            </button>
          ) : <div></div>}

          {step < 4 ? (
            <button
              onClick={handleNext}
              className="px-8 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition shadow-md"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-8 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition shadow-md disabled:opacity-70 flex items-center justify-center min-w-[180px]"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : "Complete Profile"}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
