import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About Us | AuditSwarm",
  description: "Learn about AuditSwarm.",
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
              <h2 className="text-3xl font-bold mb-4">The Journey Through All Three Lines</h2>
              <p className="text-gray-700 leading-relaxed">
                Hi, I'm Rich Penfil. My career has taken me on a journey that few data scientists get to experience—working across all three lines of defense. And let me tell you, it's given me a perspective that fundamentally changed how I think about audit and risk.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                I started in the <strong>first line of defense</strong> as a data scientist, embedded in the business. I built models, automated processes, and learned firsthand how operational teams think about risk (spoiler: they often don't, until something breaks). It was exciting, fast-paced work—but I couldn't shake the feeling that there was a bigger picture I wasn't seeing.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4">Finding My Way to the Best Line</h2>
              <p className="text-gray-700 leading-relaxed">
                So I moved to the <strong>second line of defense</strong>—still as a data scientist, but now with a risk management lens. I got to see how controls were designed, how policies were written, and how the organization tried to prevent bad things from happening. Good work, important work. But something was still missing.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                Then I found internal audit. The <strong>third line of defense</strong>. The best line. (I'll die on this hill.)
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                Why is it the best? Because internal audit is where you get the complete picture. You're not just building controls or managing risks—you're independently evaluating whether any of it actually works. You're the last line of defense before something truly goes wrong. And when you're working in a department with over 1,500 internal auditors, you realize just how critical—and complex—this work really is.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
              <p className="text-gray-700 leading-relaxed">
                This platform is built to help auditors create, share, and discover workflow templates that actually make sense for audit work. No more reinventing the wheel on every engagement. No more starting from scratch when someone in another department already solved that exact problem.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                We're building a community where auditors help auditors. Because at the end of the day, we're all on the same team—the third line.
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
