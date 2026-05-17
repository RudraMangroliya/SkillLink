import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft } from 'lucide-react';

const TermsOfServicePage = () => {
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
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center shrink-0">
              <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">Terms of Service</h1>
              <p className="text-gray-500 dark:text-gray-400">Effective Date: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="prose prose-indigo dark:prose-invert max-w-none space-y-6 text-gray-600 dark:text-gray-300">
            <p>
              Welcome to SkillLink! These Terms of Service ("Terms") govern your access to and use of our website, services, and applications. By accessing or using our Services, you agree to be bound by these Terms and our Privacy Policy.
            </p>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">1. Eligibility</h2>
            <p>
              You must be at least 16 years old to use our Services. By creating an account, you represent and warrant that you are of legal age to form a binding contract and meet all eligibility requirements.
            </p>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">2. User Accounts & Security</h2>
            <p>
              To access certain features of the platform, you must register for an account. You agree to provide accurate, current, and complete information during the registration process. You are strictly responsible for safeguarding your password and any activities or actions under your account.
            </p>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">3. Prohibited Conduct</h2>
            <p>
              You agree not to engage in any of the following prohibited activities:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Using the Service for any illegal purpose or in violation of any local, state, national, or international law.</li>
              <li>Harassing, abusing, or harming another person through our Chat or Group features.</li>
              <li>Impersonating or misrepresenting your affiliation with any person or entity.</li>
              <li>Attempting to interfere with or compromise the system integrity or security or decipher any transmissions to or from the servers.</li>
              <li>Uploading invalid data, viruses, worms, or other software agents.</li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">4. Content Ownership and License</h2>
            <p>
              You retain your rights to any content you submit, post or display on or through the Services (such as your Profile, Resume, and Messages). By submitting content, you grant SkillLink a worldwide, non-exclusive, royalty-free license to use, copy, reproduce, process, adapt, modify, publish, transmit, and display the content to operate and provide the Services.
            </p>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">5. Termination</h2>
            <p>
              We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach these Terms. Upon termination, your right to use the Service will immediately cease.
            </p>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">6. Changes to Terms</h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
