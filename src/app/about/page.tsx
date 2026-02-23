import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import type { Metadata } from "next"
import { headers } from "next/headers"
import { getSiteConfig } from "@/lib/site/config"

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers()
  const host = headersList.get('host') || ''
  const site = getSiteConfig(host)
  return {
    title: `About Us | ${site.name}`,
    description: `Learn about ${site.name}.`,
  }
}

export default async function AboutPage() {
  const headersList = await headers()
  const host = headersList.get('host') || ''
  const site = getSiteConfig(host)

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
              <h2 className="text-3xl font-bold mb-4">Built at the DTCC Hackathon</h2>
              <p className="text-gray-700 leading-relaxed">
                This project was created for the <a href="https://communications.dtcc.com/dtcc-hackathon-registration-18146.html" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline font-semibold">DTCC Hackathon</a> -a challenge to reimagine what's possible when technology meets internal audit. We saw it as the perfect opportunity to build something auditors have needed for a long time: a shared platform for workflows powered by AI agents that actually understand audit work.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
              <p className="text-gray-700 leading-relaxed">
                This platform is built to help auditors create, share, and discover workflow templates that actually make sense for audit work. No more reinventing the wheel on every engagement. No more starting from scratch when someone in another department already solved that exact problem.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                We're building a community where auditors help auditors. Because at the end of the day, we're all on the same team -the third line.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4">A Call to Action</h2>
              <p className="text-gray-700 leading-relaxed">
                Do not stand on the sidelines. Do not walk. <strong>Run.</strong> Run to be the change in internal audit.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                We are in a pivotal moment -not just for our industry, but for the world at large. AI is reshaping every profession it touches, and audit has a once-in-a-generation opportunity to shape that future rather than be shaped by it. The playbook is being rewritten right now, and the auditors who lean in -who build, share, and experiment -are the ones who will define what this profession looks like for decades to come.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                <strong>Do not leave anything in the tank these next 12 months.</strong> The tools are here. The community is forming. The window is open. Every day you wait is a day someone else is getting better. So get in the game, put in the work, and let's build something that matters. The only question left is whether you're going to be part of it -or wish you had been.
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
