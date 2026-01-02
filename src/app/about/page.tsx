import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About Us | AuditToolbox",
  description: "Learn about AuditToolbox and its creator Rich Penfil.",
}

export default function AboutPage() {
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
          <h1 className="text-5xl font-black mb-8">About Us</h1>

          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-3xl font-bold mb-4">Our Story</h2>
              <p className="text-gray-700 leading-relaxed">
                AuditToolbox is created and maintained by Rich Penfil, an audit professional with over 7 years of experience in internal audit.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4">Experience</h2>
              <p className="text-gray-700 leading-relaxed">
                Rich has worked across all three lines of defense and has experience in internal audit departments with over 1,500 auditors. His ideas and the tools on this platform are inspired by and developed for the audit community.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
              <p className="text-gray-700 leading-relaxed">
                The platform aims to help auditors create, share, and discover workflow templates that streamline audit processes.
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
