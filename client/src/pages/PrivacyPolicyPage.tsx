import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pt-24 pb-12 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-8 sm:p-12 transition-colors">
          <div className="flex items-center gap-4 mb-8 border-b border-gray-100 dark:border-slate-700 pb-8">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center shrink-0">
              <Shield className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">Privacy Policy</h1>
              <p className="text-gray-500 dark:text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="prose prose-indigo dark:prose-invert max-w-none space-y-6 text-gray-600 dark:text-gray-300">
            <p>
              At SkillLink, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our professional networking services.
            </p>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">1. Information We Collect</h2>
            <p>
              We collect information that you provide directly to us when you register for an account, create or modify your profile, set preferences, sign-up for or make purchases through our Services. This includes:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Personal Data:</strong> Name, email address, password, phone number, and location.</li>
              <li><strong>Professional Data:</strong> Employment history, education history, skills, certifications, and portfolio links.</li>
              <li><strong>Media:</strong> Profile pictures and resume documents (PDFs) uploaded to our servers.</li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">2. How We Use Your Information</h2>
            <p>
              We use the information we collect to provide, maintain, and improve our services, specifically to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Facilitate account creation and authentication.</li>
              <li>Match you with relevant job opportunities using our AI recommendation engine.</li>
              <li>Enable user-to-user communication via real-time chat and group discussions.</li>
              <li>Send administrative information, such as updates, security alerts, and support messages.</li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">3. Data Security</h2>
            <p>
              We implement a variety of security measures to maintain the safety of your personal information. Your account is protected by an encrypted password, and we utilize secure server architectures to prevent unauthorized access. However, no electronic transmission over the internet or information storage technology can be guaranteed to be 100% secure.
            </p>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">4. Third-Party Services</h2>
            <p>
              We may share your data with third-party vendors, service providers, contractors, or agents who perform services for us or on our behalf. For example, we use Cloudinary for secure media storage and MongoDB for database management.
            </p>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">5. Contact Us</h2>
            <p>
              If you have questions or comments about this Privacy Policy, please contact us at: <a href="mailto:support@skilllink.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">support@skilllink.com</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
