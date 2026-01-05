import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact | AuditSwarm",
  description: "Contact information for AuditSwarm.",
}

export default function ContactPage() {
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
          <h1 className="text-5xl font-black mb-8">Contact</h1>

          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-3xl font-bold mb-4">Get in Touch</h2>
              <p className="text-gray-700 leading-relaxed">
                For inquiries, feedback, or support, please reach out using the contact information below.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4">Contact Information</h2>
              <div className="bg-amber-50 p-6 rounded-lg border border-amber-200">
                <p className="text-gray-700"><strong>Name:</strong> Rich Penfil</p>
                <p className="text-gray-700 mt-2"><strong>Email:</strong> <a href="mailto:Rich@audittoolbox.com" className="text-indigo-600 hover:underline">Rich@audittoolbox.com</a></p>
                <p className="text-gray-700 mt-2"><strong>Platform:</strong> AuditSwarm</p>
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4">Response Time</h2>
              <p className="text-gray-700 leading-relaxed">
                We aim to respond to all inquiries within 1-2 business days. For urgent matters, please indicate so in your message subject line.
              </p>
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
