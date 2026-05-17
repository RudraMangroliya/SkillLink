import React, { useState, useRef, useEffect } from "react";
import { X, Upload, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import axiosInstance from "../utils/axios";
import { useDispatch, useSelector } from "react-redux";
import { setCredentials, logout } from "../store/slices/authSlice";
import type { RootState } from "../store/store";
import { useNavigate } from "react-router-dom";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileData: any;
  onSuccess: () => void;
}

export default function EditProfileModal({ isOpen, onClose, profileData, onSuccess }: EditProfileModalProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token } = useSelector((state: RootState) => state.auth);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    headline: "",
    bio: "",
    location: "",
    skills: "",
    interests: "",
    githubLink: "",
    portfolioLink: "",
  });

  const [experience, setExperience] = useState<any[]>([]);
  const [education, setEducation] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [certifications, setCertifications] = useState<any[]>([]);

  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [backgroundImageFile, setBackgroundImageFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const profileInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profileData) {
      setFormData({
        name: user?.name || "",
        headline: profileData.headline || "",
        bio: profileData.bio || "",
        location: profileData.location || "",
        skills: profileData.skills ? profileData.skills.join(", ") : "",
        interests: profileData.interests ? profileData.interests.join(", ") : "",
        githubLink: profileData.githubLink || "",
        portfolioLink: profileData.portfolioLink || "",
      });
      setExperience(profileData.experience || []);
      setEducation(profileData.education || []);
      setProjects(profileData.projects || []);
      setCertifications(profileData.certifications || []);
      setProfileImageFile(null);
      setBackgroundImageFile(null);
      setResumeFile(null);
      setError("");
    }
  }, [profileData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.headline.trim() || !formData.location.trim() || !formData.bio.trim() || !formData.skills.trim()) {
      setError("Name, Headline, Location, Bio, and Skills are required fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const cleanExperience = experience.filter(e => e.company.trim() || e.title.trim());
      const cleanEducation = education.filter(e => e.institution.trim() || e.degree.trim());
      const cleanProjects = projects.filter(p => p.title.trim());
      const cleanCertifications = certifications.filter(c => c.name.trim() || c.issuer.trim());

      // 1. Update text fields
      const profilePayload = {
        name: formData.name,
        headline: formData.headline,
        bio: formData.bio,
        location: formData.location,
        skills: formData.skills.split(",").map(s => s.trim()).filter(s => s),
        interests: formData.interests.split(",").map(s => s.trim()).filter(s => s),
        githubLink: formData.githubLink,
        portfolioLink: formData.portfolioLink,
        experience: cleanExperience,
        education: cleanEducation,
        projects: cleanProjects,
        certifications: cleanCertifications,
      };

      await axiosInstance.post("/api/profile", profilePayload);

      let updatedUser = { ...user, name: formData.name };

      // 2. Upload Profile Image
      if (profileImageFile) {
        const imageForm = new FormData();
        imageForm.append("image", profileImageFile);
        const imgRes = await axiosInstance.post("/api/profile/upload-image", imageForm, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        if (imgRes.data.profileImage) {
          updatedUser.profileImage = imgRes.data.profileImage;
        }
      }

      // 3. Upload Background Image
      if (backgroundImageFile) {
        const bgForm = new FormData();
        bgForm.append("backgroundImage", backgroundImageFile);
        const bgRes = await axiosInstance.post("/api/profile/upload-background", bgForm, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        if (bgRes.data.backgroundImage) {
          updatedUser.backgroundImage = bgRes.data.backgroundImage;
        }
      }

      // Update Redux state if name or images changed
      dispatch(setCredentials({ user: updatedUser, token: token as string }));

      // 4. Upload Resume
      if (resumeFile) {
        const resumeForm = new FormData();
        resumeForm.append("resume", resumeFile);
        await axiosInstance.post("/api/profile/upload-resume", resumeForm, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Update profile error:", err);
      const errMsg = err.response?.data?.message || err.message || "Failed to update profile.";
      setError(`Error: ${errMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await axiosInstance.delete("/api/auth/delete-account");
      dispatch(logout());
      navigate("/");
    } catch (err: any) {
      console.error("Delete account error:", err);
      setError(err.response?.data?.message || "Failed to delete account");
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden relative flex flex-col animate-fade-in transition-colors">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Profile</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/50">{error}</div>}
          
          <form id="edit-profile-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Media Uploads */}
            <div className="bg-indigo-50/50 dark:bg-indigo-900/20 p-5 rounded-2xl border border-indigo-50 dark:border-indigo-900/30 space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center"><ImageIcon size={18} className="mr-2 text-indigo-600 dark:text-indigo-400" /> Media & Images</h3>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition">
                  <input type="file" ref={profileInputRef} className="hidden" accept="image/*" onChange={(e) => setProfileImageFile(e.target.files?.[0] || null)} />
                  <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-700 mb-2 overflow-hidden border border-gray-200 dark:border-slate-600">
                    {profileImageFile ? (
                      <img src={URL.createObjectURL(profileImageFile)} alt="Profile Preview" className="w-full h-full object-cover" />
                    ) : user?.profileImage ? (
                      <img src={user.profileImage} alt="Current Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">👤</span>
                    )}
                  </div>
                  <button type="button" onClick={() => profileInputRef.current?.click()} className="text-xs font-medium text-indigo-600 dark:text-indigo-400">Change Avatar</button>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition">
                  <input type="file" ref={backgroundInputRef} className="hidden" accept="image/*" onChange={(e) => setBackgroundImageFile(e.target.files?.[0] || null)} />
                  <div className="w-full h-16 rounded-lg bg-gray-100 dark:bg-slate-700 mb-2 overflow-hidden border border-gray-200 dark:border-slate-600">
                    {backgroundImageFile ? (
                      <img src={URL.createObjectURL(backgroundImageFile)} alt="Cover Preview" className="w-full h-full object-cover" />
                    ) : user?.backgroundImage ? (
                      <img src={user.backgroundImage} alt="Current Cover" className="w-full h-full object-cover" />
                    ) : (
                      <span className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">🖼️</span>
                    )}
                  </div>
                  <button type="button" onClick={() => backgroundInputRef.current?.click()} className="text-xs font-medium text-indigo-600 dark:text-indigo-400">Change Cover Photo</button>
                </div>
              </div>
              
              <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition">
                <input type="file" ref={resumeInputRef} className="hidden" accept="application/pdf" onChange={(e) => setResumeFile(e.target.files?.[0] || null)} />
                <FileText size={24} className="text-gray-400 dark:text-gray-500 mb-2" />
                <button type="button" onClick={() => resumeInputRef.current?.click()} className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                  {resumeFile ? resumeFile.name : profileData?.resumeUrl ? "Update PDF Resume" : "Upload PDF Resume"}
                </button>
              </div>
            </div>

            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-slate-700 pb-2">Basic Information</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Headline</label>
                <input type="text" name="headline" value={formData.headline} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                <input type="text" name="location" value={formData.location} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                <textarea name="bio" rows={4} value={formData.bio} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
              </div>
            </div>

            {/* Skills & Links */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-slate-700 pb-2">Professional Details</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Skills (Comma separated)</label>
                <input type="text" name="skills" value={formData.skills} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Interests (Comma separated)</label>
                <input type="text" name="interests" value={formData.interests} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">GitHub Link</label>
                  <input type="url" name="githubLink" value={formData.githubLink} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none placeholder-gray-400 dark:placeholder-gray-500" placeholder="https://github.com/..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Portfolio Link</label>
                  <input type="url" name="portfolioLink" value={formData.portfolioLink} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none placeholder-gray-400 dark:placeholder-gray-500" placeholder="https://..." />
                </div>
              </div>
            </div>

            {/* Experience */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-gray-200 dark:border-slate-700 pb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">Experience</h3>
                <button type="button" onClick={() => setExperience([...experience, { company: "", title: "", location: "", startYear: "", endYear: "", description: "", current: false }])} className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition">+ Add Experience</button>
              </div>
              {experience.map((exp, idx) => (
                <div key={idx} className="p-4 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-xl space-y-3 relative">
                  <button type="button" onClick={() => setExperience(experience.filter((_, i) => i !== idx))} className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition"><X size={18} /></button>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-6">
                    <input type="text" placeholder="Job Title" value={exp.title} onChange={(e) => { const newExp = [...experience]; newExp[idx].title = e.target.value; setExperience(newExp); }} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg text-sm placeholder-gray-400 dark:placeholder-gray-500" />
                    <input type="text" placeholder="Company" value={exp.company} onChange={(e) => { const newExp = [...experience]; newExp[idx].company = e.target.value; setExperience(newExp); }} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg text-sm placeholder-gray-400 dark:placeholder-gray-500" />
                    <input type="text" placeholder="Start Year (e.g. 2020)" value={exp.startYear} onChange={(e) => { const newExp = [...experience]; newExp[idx].startYear = e.target.value; setExperience(newExp); }} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg text-sm placeholder-gray-400 dark:placeholder-gray-500" />
                    <input type="text" placeholder="End Year (or Present)" value={exp.endYear} onChange={(e) => { const newExp = [...experience]; newExp[idx].endYear = e.target.value; setExperience(newExp); }} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg text-sm disabled:opacity-50 placeholder-gray-400 dark:placeholder-gray-500" disabled={exp.current} />
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                    <input type="checkbox" checked={exp.current} onChange={(e) => { const newExp = [...experience]; newExp[idx].current = e.target.checked; if (e.target.checked) newExp[idx].endYear = ""; setExperience(newExp); }} className="rounded text-indigo-600 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800" />
                    <label>I currently work here</label>
                  </div>
                  <textarea placeholder="Description" rows={2} value={exp.description} onChange={(e) => { const newExp = [...experience]; newExp[idx].description = e.target.value; setExperience(newExp); }} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg text-sm resize-none placeholder-gray-400 dark:placeholder-gray-500" />
                </div>
              ))}
            </div>

            {/* Education */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-gray-200 dark:border-slate-700 pb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">Education</h3>
                <button type="button" onClick={() => setEducation([...education, { institution: "", degree: "", fieldOfStudy: "", startYear: "", endYear: "" }])} className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition">+ Add Education</button>
              </div>
              {education.map((edu, idx) => (
                <div key={idx} className="p-4 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-xl space-y-3 relative">
                  <button type="button" onClick={() => setEducation(education.filter((_, i) => i !== idx))} className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition"><X size={18} /></button>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-6">
                    <input type="text" placeholder="Institution / University" value={edu.institution} onChange={(e) => { const newEdu = [...education]; newEdu[idx].institution = e.target.value; setEducation(newEdu); }} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg text-sm placeholder-gray-400 dark:placeholder-gray-500" />
                    <input type="text" placeholder="Degree (e.g. B.Tech)" value={edu.degree} onChange={(e) => { const newEdu = [...education]; newEdu[idx].degree = e.target.value; setEducation(newEdu); }} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg text-sm placeholder-gray-400 dark:placeholder-gray-500" />
                    <input type="text" placeholder="Field of Study" value={edu.fieldOfStudy} onChange={(e) => { const newEdu = [...education]; newEdu[idx].fieldOfStudy = e.target.value; setEducation(newEdu); }} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg text-sm placeholder-gray-400 dark:placeholder-gray-500" />
                    <div className="flex gap-2">
                      <input type="text" placeholder="Start Year" value={edu.startYear} onChange={(e) => { const newEdu = [...education]; newEdu[idx].startYear = e.target.value; setEducation(newEdu); }} className="w-1/2 px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg text-sm placeholder-gray-400 dark:placeholder-gray-500" />
                      <input type="text" placeholder="End Year" value={edu.endYear} onChange={(e) => { const newEdu = [...education]; newEdu[idx].endYear = e.target.value; setEducation(newEdu); }} className="w-1/2 px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg text-sm placeholder-gray-400 dark:placeholder-gray-500" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Projects */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-gray-200 dark:border-slate-700 pb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">Projects</h3>
                <button type="button" onClick={() => setProjects([...projects, { title: "", description: "", link: "" }])} className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition">+ Add Project</button>
              </div>
              {projects.map((proj, idx) => (
                <div key={idx} className="p-4 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-xl space-y-3 relative">
                  <button type="button" onClick={() => setProjects(projects.filter((_, i) => i !== idx))} className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition"><X size={18} /></button>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-6">
                    <input type="text" placeholder="Project Title" value={proj.title} onChange={(e) => { const newProj = [...projects]; newProj[idx].title = e.target.value; setProjects(newProj); }} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg text-sm placeholder-gray-400 dark:placeholder-gray-500" />
                    <input type="url" placeholder="Project Link" value={proj.link} onChange={(e) => { const newProj = [...projects]; newProj[idx].link = e.target.value; setProjects(newProj); }} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg text-sm placeholder-gray-400 dark:placeholder-gray-500" />
                  </div>
                  <textarea placeholder="Project Description" rows={2} value={proj.description} onChange={(e) => { const newProj = [...projects]; newProj[idx].description = e.target.value; setProjects(newProj); }} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg text-sm resize-none placeholder-gray-400 dark:placeholder-gray-500" />
                </div>
              ))}
            </div>

            {/* Certifications */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-gray-200 dark:border-slate-700 pb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">Certifications</h3>
                <button type="button" onClick={() => setCertifications([...certifications, { name: "", issuer: "", date: "" }])} className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition">+ Add Certification</button>
              </div>
              {certifications.map((cert, idx) => (
                <div key={idx} className="p-4 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-xl space-y-3 relative flex flex-col sm:flex-row gap-3 pr-8">
                  <button type="button" onClick={() => setCertifications(certifications.filter((_, i) => i !== idx))} className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition"><X size={18} /></button>
                  <input type="text" placeholder="Certification Name" value={cert.name} onChange={(e) => { const newCert = [...certifications]; newCert[idx].name = e.target.value; setCertifications(newCert); }} className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg text-sm placeholder-gray-400 dark:placeholder-gray-500" />
                  <input type="text" placeholder="Issuer (e.g. Coursera)" value={cert.issuer} onChange={(e) => { const newCert = [...certifications]; newCert[idx].issuer = e.target.value; setCertifications(newCert); }} className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg text-sm placeholder-gray-400 dark:placeholder-gray-500" />
                  <input type="date" value={cert.date ? new Date(cert.date).toISOString().split('T')[0] : ''} onChange={(e) => { const newCert = [...certifications]; newCert[idx].date = e.target.value; setCertifications(newCert); }} className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg text-sm" />
                </div>
              ))}
            </div>

          </form>
        </div>

        {showDeleteConfirm ? (
          <div className="p-6 bg-red-50 dark:bg-red-900/20 border-t border-red-100 dark:border-red-900/50 flex flex-col gap-3">
            <h4 className="font-bold text-red-700 dark:text-red-400">Are you absolutely sure?</h4>
            <p className="text-sm text-red-600 dark:text-red-400 mb-2">
              This action cannot be undone. This will permanently delete your account, connections, followers, media files, and completely remove your data from our servers.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setShowDeleteConfirm(false)} 
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition text-sm"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition text-sm flex items-center disabled:opacity-70"
              >
                {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {deleting ? "Deleting..." : "Yes, delete my account"}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 flex justify-between items-center gap-3">
            <button 
              type="button" 
              onClick={() => setShowDeleteConfirm(true)} 
              className="px-4 py-2 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 font-medium rounded-xl hover:bg-red-50 dark:hover:bg-red-900/30 hover:border-red-300 transition text-sm"
            >
              Delete Account
            </button>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition">
                Cancel
              </button>
              <button 
                type="submit" 
                form="edit-profile-form" 
                disabled={loading} 
                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition shadow-md flex items-center disabled:opacity-70"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
