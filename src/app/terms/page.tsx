import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service | AuditSwarm",
  description: "Terms of Service for AuditSwarm.",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <Link href="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <div className="bg-white/80 backdrop-blur-md rounded-xl border shadow-lg p-8">
          <h1 className="text-5xl font-black mb-4">Terms of Service</h1>
          <p className="text-gray-600 mb-8">Last updated: January 2025</p>

          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-3xl font-bold mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing or using AuditSwarm, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the service.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4">2. Description of Service</h2>
              <p className="text-gray-700 leading-relaxed">
                AuditSwarm is a workflow template marketplace for auditors. Users can create, share, and download visual workflow diagrams. The service is provided "as is" for professional use in audit and compliance contexts.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4">3. User Accounts</h2>
              <p className="text-gray-700 leading-relaxed">
                To access certain features, you must sign in using LinkedIn authentication. You are responsible for maintaining the security of your account and for all activities that occur under your account.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4">4. User Content</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You retain ownership of workflow templates and content you create on AuditSwarm. By sharing content publicly, you grant other users the right to view, download, and use your workflows for their audit processes.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">You agree not to upload content that:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Infringes on intellectual property rights</li>
                <li>Contains malicious code or scripts</li>
                <li>Violates any applicable laws or regulations</li>
                <li>Contains confidential or proprietary information without authorization</li>
              </ul>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4">5. Acceptable Use</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You agree to use AuditSwarm only for lawful purposes and in accordance with these terms. You agree not to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Attempt to gain unauthorized access to the service or its systems</li>
                <li>Interfere with or disrupt the service or servers</li>
                <li>Use automated systems to access the service without permission</li>
                <li>Impersonate any person or entity</li>
              </ul>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4">6. Intellectual Property</h2>
              <p className="text-gray-700 leading-relaxed">
                The AuditSwarm platform, including its design, features, and code, is owned by AuditSwarm and protected by intellectual property laws. Workflow templates created by users remain the property of their respective creators.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4">7. Disclaimer of Warranties</h2>
              <p className="text-gray-700 leading-relaxed">
                AuditSwarm is provided "as is" without warranties of any kind. We do not guarantee that the service will be uninterrupted, secure, or error-free. Workflow templates are community-contributed and should be reviewed before use in production audit processes.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4">8. Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed">
                To the maximum extent permitted by law, AuditSwarm shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4">9. Termination</h2>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to suspend or terminate your access to AuditSwarm at any time for violations of these terms or for any other reason at our discretion.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4">10. Changes to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                We may modify these terms at any time. Continued use of the service after changes constitutes acceptance of the modified terms.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4">11. Contact</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                For questions about these terms, please contact us:
              </p>
              <div className="bg-amber-50 p-6 rounded-lg border border-amber-200">
                <p className="text-gray-700"><strong>Email:</strong> <a href="mailto:Rich@audittoolbox.com" className="text-indigo-600 hover:underline">Rich@audittoolbox.com</a></p>
                <p className="text-gray-700 mt-2"><strong>Platform:</strong> AuditSwarm</p>
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
    </div>
  )
}
