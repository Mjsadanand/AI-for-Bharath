import { Link } from 'react-router-dom';
import { ChevronRight, ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-900/50 backdrop-blur-md border-b border-slate-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link to="/" className="inline-flex items-center text-slate-300 hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-white">Privacy Policy</h1>
          <p className="text-slate-400 mt-2">Last updated: March 21, 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-invert max-w-none">
          {/* Introduction */}
          <section className="mb-12 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <ChevronRight className="w-5 h-5 mr-2 text-blue-400" />
              1. Introduction
            </h2>
            <p className="text-slate-300 leading-relaxed">
              Our healthcare platform ("Company," "we," "us," or "our") is committed to protecting your
              privacy and ensuring you have a positive experience on our website and through our services
              (the "Service"). This Privacy Policy explains our information collection, use, and disclosure practices.
            </p>
          </section>

          {/* Information We Collect */}
          <section className="mb-12 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <ChevronRight className="w-5 h-5 mr-2 text-blue-400" />
              2. Information We Collect
            </h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              We collect information you voluntarily provide and information automatically collected through your use of the Service.
            </p>
            
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">2.1 Information You Provide</h3>
            <ul className="list-disc list-inside space-y-2 text-slate-300">
              <li><strong>Account Information:</strong> Name, email, password, contact information, and role/credentials</li>
              <li><strong>Health Information:</strong> Medical history, clinical notes, test results, diagnoses, and medications</li>
              <li><strong>Profile Information:</strong> Professional credentials, specialties, and qualifications</li>
              <li><strong>Communication Data:</strong> Messages, feedback, and support inquiries</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">2.2 Information Automatically Collected</h3>
            <ul className="list-disc list-inside space-y-2 text-slate-300">
              <li><strong>Access Logs:</strong> IP address, device type, browser type, and operating system</li>
              <li><strong>Usage Data:</strong> Pages visited, time spent, and features used</li>
              <li><strong>Cookies and Similar Technologies:</strong> Session identifiers, preferences, and analytics data</li>
            </ul>
          </section>

          {/* Protected Health Information */}
          <section className="mb-12 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <ChevronRight className="w-5 h-5 mr-2 text-blue-400" />
              3. Protected Health Information (PHI)
            </h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              We handle Protected Health Information (PHI) in compliance with the Health Insurance Portability and
              Accountability Act (HIPAA) and other applicable healthcare privacy laws.
            </p>
            <p className="text-slate-300 leading-relaxed">
              Your health information is stored with the highest level of security and encryption. We limit access to
              authorized healthcare providers and staff only. You have the right to access, amend, and receive an
              accounting of disclosures of your PHI.
            </p>
          </section>

          {/* How We Use Your Information */}
          <section className="mb-12 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <ChevronRight className="w-5 h-5 mr-2 text-blue-400" />
              4. How We Use Your Information
            </h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-300">
              <li>Provide, maintain, and improve the Service</li>
              <li>Deliver healthcare services and clinical documentation</li>
              <li>Process transactions and send billing information</li>
              <li>Send administrative, transactional, and promotional communications</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Conduct analytics, research, and service improvements</li>
              <li>Comply with legal obligations and enforce agreements</li>
              <li>Detect, prevent, and address fraud and security issues</li>
            </ul>
          </section>

          {/* Data Security */}
          <section className="mb-12 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <ChevronRight className="w-5 h-5 mr-2 text-blue-400" />
              5. Data Security
            </h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              We implement comprehensive technical, physical, and administrative safeguards to protect your information, including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-300">
              <li>End-to-end encryption for data in transit and at rest</li>
              <li>Secure authentication mechanisms (multi-factor authentication)</li>
              <li>Regular security audits and penetration testing</li>
              <li>Access controls and role-based permissions</li>
              <li>Data encryption using industry-standard protocols (TLS 1.3)</li>
              <li>Regular backup and disaster recovery procedures</li>
            </ul>
            <p className="text-slate-300 leading-relaxed mt-4">
              While we have implemented robust security measures, no method of transmission over the internet is 100% secure.
              We cannot guarantee absolute security of your information.
            </p>
          </section>

          {/* Sharing Your Information */}
          <section className="mb-12 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <ChevronRight className="w-5 h-5 mr-2 text-blue-400" />
              6. Sharing Your Information
            </h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              We may share your information in the following circumstances:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-300">
              <li>
                <strong>Healthcare Providers:</strong> With doctors, specialists, and healthcare facilities treating you
              </li>
              <li>
                <strong>Service Providers:</strong> With vendors who assist us in operating the Service (under confidentiality agreements)
              </li>
              <li>
                <strong>Legal Compliance:</strong> When required by law or court order
              </li>
              <li>
                <strong>Safety:</strong> When necessary to prevent harm to individuals or protect public health
              </li>
              <li>
                <strong>Business Transfers:</strong> In case of merger, acquisition, or bankruptcy
              </li>
            </ul>
          </section>

          {/* Your Privacy Rights */}
          <section className="mb-12 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <ChevronRight className="w-5 h-5 mr-2 text-blue-400" />
              7. Your Privacy Rights
            </h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              You have the following rights regarding your personal and health information:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-300">
              <li><strong>Right to Access:</strong> Request and obtain a copy of your information</li>
              <li><strong>Right to Correct:</strong> Request correction of inaccurate information</li>
              <li><strong>Right to Delete:</strong> Request deletion of your information (subject to legal requirements)</li>
              <li><strong>Right to Portability:</strong> Request your information in a portable format</li>
              <li><strong>Right to Opt-Out:</strong> Opt out of certain communications and data uses</li>
              <li><strong>Right to Restrict:</strong> Request restrictions on how your information is used</li>
            </ul>
            <p className="text-slate-300 leading-relaxed mt-4">
              To exercise these rights, please contact us at privacy@company.com.
            </p>
          </section>

          {/* Cookies and Tracking */}
          <section className="mb-12 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <ChevronRight className="w-5 h-5 mr-2 text-blue-400" />
              8. Cookies and Tracking Technologies
            </h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              We use cookies and similar tracking technologies to enhance your experience, analyze usage patterns,
              and improve our Service.
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-300">
              <li><strong>Essential Cookies:</strong> Required for authentication and security</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how you use the Service</li>
              <li><strong>Preference Cookies:</strong> Store your preferences and settings</li>
            </ul>
            <p className="text-slate-300 leading-relaxed mt-4">
              You can control cookie preferences through your browser settings. Disabling cookies may affect Service functionality.
            </p>
          </section>

          {/* Data Retention */}
          <section className="mb-12 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <ChevronRight className="w-5 h-5 mr-2 text-blue-400" />
              9. Data Retention
            </h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              We retain your information as long as necessary to provide the Service and comply with legal obligations:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-300">
              <li>Health information is retained for the duration of your care relationship and applicable legal requirements</li>
              <li>Account information is retained until you request deletion or your account is terminated</li>
              <li>Log and usage data is typically retained for 12 months</li>
            </ul>
          </section>

          {/* Third-Party Links */}
          <section className="mb-12 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <ChevronRight className="w-5 h-5 mr-2 text-blue-400" />
              10. Third-Party Links
            </h2>
            <p className="text-slate-300 leading-relaxed">
              Our Service may contain links to third-party websites and services. We are not responsible for the privacy
              practices of these external sites. We encourage you to review their privacy policies before providing any
              personal information.
            </p>
          </section>

          {/* Children's Privacy */}
          <section className="mb-12 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <ChevronRight className="w-5 h-5 mr-2 text-blue-400" />
              11. Children's Privacy
            </h2>
            <p className="text-slate-300 leading-relaxed">
              The Service is not directed to children under 18 years of age. We do not knowingly collect personal information
              from children. If we become aware that we have collected information from a child, we will delete such information
              and terminate the child's account.
            </p>
          </section>

          {/* International Transfers */}
          <section className="mb-12 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <ChevronRight className="w-5 h-5 mr-2 text-blue-400" />
              12. International Data Transfers
            </h2>
            <p className="text-slate-300 leading-relaxed">
              If you are located outside the United States, please note that your information may be transferred to,
              stored in, and processed in the United States, which may have different data protection laws than your country.
              By using the Service, you consent to such transfers and processing.
            </p>
          </section>

          {/* Privacy Policy Changes */}
          <section className="mb-12 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <ChevronRight className="w-5 h-5 mr-2 text-blue-400" />
              13. Changes to This Privacy Policy
            </h2>
            <p className="text-slate-300 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of material changes by posting the
              updated policy on the Service and updating the "Last updated" date. Your continued use of the Service following
              any changes constitutes acceptance of the revised Privacy Policy.
            </p>
          </section>

          {/* Contact Information */}
          <section className="mb-12 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <ChevronRight className="w-5 h-5 mr-2 text-blue-400" />
              14. Contact Us
            </h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              If you have questions about this Privacy Policy or our privacy practices, please contact us:
            </p>
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600">
              <p className="text-slate-300">
                <span className="text-white font-semibold">Privacy Officer Email:</span> privacy@company.com
              </p>
              <p className="text-slate-300 mt-2">
                <span className="text-white font-semibold">Support Email:</span> support@company.com
              </p>
              <p className="text-slate-300 mt-2">
                <span className="text-white font-semibold">Address:</span> [Company Address]
              </p>
            </div>
          </section>

          {/* Links to Legal Documents */}
          <div className="mt-12 pt-8 border-t border-slate-700">
            <p className="text-slate-300 mb-4">
              For more information, please review our <Link to="/terms-of-service" className="text-blue-400 hover:text-blue-300">Terms of Service</Link>.
            </p>
            <Link
              to="/"
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Back to Home
              <ChevronRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
