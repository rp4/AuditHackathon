import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy - Audit Agents",
  description: "Privacy Policy for Audit Agents - AI Agent Sharing Platform for Auditors",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <Link href="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <h1 className="text-5xl font-black mb-4">Privacy Policy</h1>
        <p className="text-gray-600 mb-8">Last updated: January 2025</p>

        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <h2 className="text-3xl font-bold mb-4">Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              Welcome to Audit Agents ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">Information We Collect</h2>

            <h3 className="text-2xl font-semibold mb-3 mt-6">Personal Information</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              When you register for an account, we collect:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Email address</li>
              <li>Name and profile information</li>
              <li>Account credentials</li>
              <li>Professional information (optional)</li>
            </ul>

            <h3 className="text-2xl font-semibold mb-3 mt-6">Usage Information</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We automatically collect information about how you interact with our platform:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>IP address and device information</li>
              <li>Browser type and version</li>
              <li>Pages visited and features used</li>
              <li>Time and date of visits</li>
              <li>Agent downloads and uploads</li>
              <li>Search queries and interactions</li>
            </ul>

            <h3 className="text-2xl font-semibold mb-3 mt-6">Agent Content</h3>
            <p className="text-gray-700 leading-relaxed">
              When you upload AI agents to our platform, we collect and store the agent configurations, documentation, and related metadata that you choose to share.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use the collected information for the following purposes:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>To provide, maintain, and improve our services</li>
              <li>To create and manage your account</li>
              <li>To enable agent sharing and collaboration features</li>
              <li>To send you important updates and notifications</li>
              <li>To respond to your inquiries and support requests</li>
              <li>To analyze platform usage and improve user experience</li>
              <li>To detect, prevent, and address technical issues and security threats</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">Data Sharing and Disclosure</h2>

            <h3 className="text-2xl font-semibold mb-3 mt-6">Public Information</h3>
            <p className="text-gray-700 leading-relaxed">
              Agents you mark as public, along with your username and profile information, will be visible to other users of the platform. You control what information is made public through your privacy settings.
            </p>

            <h3 className="text-2xl font-semibold mb-3 mt-6">Service Providers</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may share your information with third-party service providers who assist us in operating our platform:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Supabase:</strong> Database hosting and authentication services</li>
              <li><strong>Vercel:</strong> Application hosting and deployment</li>
              <li><strong>Analytics providers:</strong> To understand platform usage</li>
            </ul>

            <h3 className="text-2xl font-semibold mb-3 mt-6">Legal Requirements</h3>
            <p className="text-gray-700 leading-relaxed">
              We may disclose your information if required to do so by law or in response to valid requests by public authorities (e.g., court orders or government agencies).
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">Data Security</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We implement appropriate technical and organizational security measures to protect your personal information:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Encryption of data in transit and at rest</li>
              <li>Row Level Security (RLS) policies in our database</li>
              <li>Regular security audits and updates</li>
              <li>Secure authentication mechanisms</li>
              <li>Access controls and monitoring</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">Your Rights and Choices</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You have the following rights regarding your personal information:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data</li>
              <li><strong>Portability:</strong> Export your agent data in a structured format</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
              <li><strong>Privacy settings:</strong> Control what information is public</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              To exercise these rights, please contact us at privacy@auditagents.com or through your account settings.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">Cookies and Tracking</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use cookies and similar tracking technologies to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Maintain your login session</li>
              <li>Remember your preferences</li>
              <li>Analyze platform usage and performance</li>
              <li>Provide personalized content and recommendations</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              You can control cookies through your browser settings, but disabling cookies may affect the functionality of our platform.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              Our platform is not intended for users under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">International Data Transfers</h2>
            <p className="text-gray-700 leading-relaxed">
              Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">Changes to This Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. Significant changes will be communicated via email or a prominent notice on our platform.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">Contact Us</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <p className="text-gray-700"><strong>Email:</strong> privacy@auditagents.com</p>
              <p className="text-gray-700 mt-2"><strong>Address:</strong> Audit Agents Platform</p>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t">
          <Link href="/">
            <Button variant="outline" size="lg">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
