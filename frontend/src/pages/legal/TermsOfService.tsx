import { Link } from 'react-router-dom';
import { ChevronRight, ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-900/50 backdrop-blur-md border-b border-slate-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link to="/" className="inline-flex items-center text-slate-300 hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-white">Terms of Service</h1>
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
              1. Agreement to Terms
            </h2>
            <p className="text-slate-300 leading-relaxed">
              These Terms of Service ("Terms") constitute a legal agreement between you and our organization
              ("Company," "we," "us," or "our"). By accessing or using our healthcare platform (the "Service"),
              you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do
              not agree to these Terms, you must not use the Service.
            </p>
          </section>

          {/* User Eligibility */}
          <section className="mb-12 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <ChevronRight className="w-5 h-5 mr-2 text-blue-400" />
              2. User Eligibility
            </h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              By using this Service, you represent and warrant that:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-300">
              <li>You are at least 18 years of age (or the age of majority in your jurisdiction)</li>
              <li>You are legally capable of entering into binding agreements</li>
              <li>If you are a patient, you consent to receive healthcare services through this platform</li>
              <li>If you are a healthcare provider, you are licensed and authorized to practice medicine in your jurisdiction</li>
              <li>You accept full responsibility for the accuracy of all information you provide</li>
            </ul>
          </section>

          {/* Description of Service */}
          <section className="mb-12 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <ChevronRight className="w-5 h-5 mr-2 text-blue-400" />
              3. Description of Service
            </h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              Our platform provides tools for healthcare management, including but not limited to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-300">
              <li>Patient medical record management and documentation</li>
              <li>Clinical note translation and transcription services</li>
              <li>Predictive analytics for patient health outcomes</li>
              <li>Research and data analysis tools</li>
              <li>Workflow management and scheduling</li>
              <li>Patient reporting and communication</li>
            </ul>
            <p className="text-slate-300 leading-relaxed mt-4">
              The Service is provided "as is" and we do not guarantee that it is free from interruptions,
              errors, or defects.
            </p>
          </section>

          {/* User Accounts and Responsibilities */}
          <section className="mb-12 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <ChevronRight className="w-5 h-5 mr-2 text-blue-400" />
              4. User Accounts and Responsibilities
            </h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              You agree to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-300">
              <li>Create and maintain a secure password and keep it confidential</li>
              <li>Accept all responsibility for activities conducted through your account</li>
              <li>Immediately notify us of any unauthorized access or breach of security</li>
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Keep your account information updated and accurate</li>
              <li>Comply with all applicable laws and regulations</li>
            </ul>
          </section>

          {/* Protected Health Information (PHI) */}
          <section className="mb-12 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <ChevronRight className="w-5 h-5 mr-2 text-blue-400" />
              5. Protected Health Information (PHI)
            </h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              Our Service handles sensitive Protected Health Information (PHI) as defined by HIPAA (Health
              Insurance Portability and Accountability Act). By using this Service:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-300">
              <li>You understand that PHI is subject to strict confidentiality and security requirements</li>
              <li>We maintain technical, physical, and administrative safeguards for all PHI</li>
              <li>You will not share, disclose, or use PHI except as authorized by law</li>
              <li>You understand that unauthorized access or disclosure may result in legal consequences</li>
            </ul>
            <p className="text-slate-300 leading-relaxed mt-4">
              For detailed information about how we handle your health information, please review our Privacy Policy.
            </p>
          </section>

          {/* Acceptable Use Policy */}
          <section className="mb-12 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <ChevronRight className="w-5 h-5 mr-2 text-blue-400" />
              6. Acceptable Use Policy
            </h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              You agree not to use the Service to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-300">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe upon intellectual property rights of others</li>
              <li>Transmit malware, viruses, or harmful code</li>
              <li>Engage in harassment, abuse, or discrimination</li>
              <li>Attempt to gain unauthorized access to the Service</li>
              <li>Use the Service for automated data collection without authorization</li>
              <li>Share credentials or allow unauthorized use of your account</li>
              <li>Disclose or misuse patient health information</li>
              <li>Impersonate healthcare providers or patients</li>
              <li>Provide professional medical advice if not licensed to do so</li>
            </ul>
          </section>

          {/* Intellectual Property Rights */}
          <section className="mb-12 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <ChevronRight className="w-5 h-5 mr-2 text-blue-400" />
              7. Intellectual Property Rights
            </h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              All content, features, and functionality of the Service (including but not limited to all
              information, software, text, displays, images, video, and audio) are the exclusive property
              of the Company or its content suppliers and are protected by international copyright, trademark,
              and other intellectual property laws.
            </p>
            <p className="text-slate-300 leading-relaxed">
              You are granted a limited, non-exclusive, non-transferable, revocable license to access and
              use the Service for its intended purpose. You may not reproduce, distribute, or transmit
              content without prior written permission.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section className="mb-12 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <ChevronRight className="w-5 h-5 mr-2 text-blue-400" />
              8. Limitation of Liability
            </h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              TO THE FULLEST EXTENT PERMITTED BY LAW:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-300">
              <li>
                The Service is provided "as is" without warranties of any kind, expressed or implied
              </li>
              <li>
                We do not warrant that the Service will be uninterrupted, secure, or error-free
              </li>
              <li>
                In no event shall the Company be liable for indirect, incidental, special, consequential,
                or punitive damages, even if advised of the possibility of such damages
              </li>
              <li>
                Our total liability shall not exceed the amount you paid for the Service in the past 12 months
              </li>
            </ul>
            <p className="text-slate-300 leading-relaxed mt-4">
              The Service is not a substitute for professional medical advice, diagnosis, or treatment.
              Always seek the advice of a qualified healthcare provider.
            </p>
          </section>

          {/* Indemnification */}
          <section className="mb-12 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <ChevronRight className="w-5 h-5 mr-2 text-blue-400" />
              9. Indemnification
            </h2>
            <p className="text-slate-300 leading-relaxed">
              You agree to indemnify and hold harmless the Company and its officers, directors, employees,
              and agents from any claims, damages, losses, liabilities, and expenses (including attorney's fees)
              arising out of or related to your use of the Service, your violation of these Terms, or your
              violation of any rights of another party.
            </p>
          </section>

          {/* Termination */}
          <section className="mb-12 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <ChevronRight className="w-5 h-5 mr-2 text-blue-400" />
              10. Termination
            </h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              We may terminate or suspend your account and access to the Service, with or without notice,
              for conduct that violates these Terms or is otherwise harmful to the Service or other users.
            </p>
            <p className="text-slate-300 leading-relaxed">
              Upon termination, your right to use the Service ceases immediately. We may, in our discretion,
              delete or retain your account information and content.
            </p>
          </section>

          {/* Modifications to Terms */}
          <section className="mb-12 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <ChevronRight className="w-5 h-5 mr-2 text-blue-400" />
              11. Modifications to Terms
            </h2>
            <p className="text-slate-300 leading-relaxed">
              We reserve the right to modify these Terms at any time. Changes will be effective immediately
              upon posting to the Service. Your continued use of the Service following the posting of revised
              Terms means you accept and agree to the changes. We encourage you to review these Terms periodically.
            </p>
          </section>

          {/* Dispute Resolution */}
          <section className="mb-12 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <ChevronRight className="w-5 h-5 mr-2 text-blue-400" />
              12. Dispute Resolution
            </h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              Any disputes arising out of or related to these Terms or the Service shall be governed by
              and construed in accordance with the laws of the jurisdiction in which the Company is located,
              without regard to its conflict of law provisions.
            </p>
            <p className="text-slate-300 leading-relaxed">
              You agree to submit to the exclusive jurisdiction of the courts located in that jurisdiction
              and waive any objections to venue or inconvenient forum.
            </p>
          </section>

          {/* Entire Agreement */}
          <section className="mb-12 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <ChevronRight className="w-5 h-5 mr-2 text-blue-400" />
              13. Entire Agreement
            </h2>
            <p className="text-slate-300 leading-relaxed">
              These Terms, along with our Privacy Policy and any other agreements you have entered into
              with us, constitute the entire agreement between you and the Company with respect to the
              Service and supersede all prior or contemporaneous communications, representations, or
              warranties, whether oral or written.
            </p>
          </section>

          {/* Contact Information */}
          <section className="mb-12 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <ChevronRight className="w-5 h-5 mr-2 text-blue-400" />
              14. Contact Information
            </h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600">
              <p className="text-slate-300">
                <span className="text-white font-semibold">Email:</span> support@company.com
              </p>
              <p className="text-slate-300 mt-2">
                <span className="text-white font-semibold">Address:</span> [Company Address]
              </p>
            </div>
          </section>

          {/* Back to Home Link */}
          <div className="mt-12 pt-8 border-t border-slate-700">
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
