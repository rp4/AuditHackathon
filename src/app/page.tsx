import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Sparkles, Star, TrendingUp, Users, ChevronRight } from "lucide-react"

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-32 px-4 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        </div>

        <div className="container mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold mb-8 animate-in">
            Trusted by Auditors Worldwide
          </div>

          {/* Main heading */}
          <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tight leading-[1.1] animate-in">
            Audit Agents
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed animate-in">
            Discover, share, and implement cutting-edge AI agents across OpenAI, Claude, Gemini, and more.
            Accelerate your audit workflows with community-tested solutions.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20 animate-in">
            <Link href="/browse">
              <Button size="lg" className="min-w-[240px] h-14 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-200 bg-purple-600 hover:bg-purple-700 text-white">
                Explore Agents
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/upload">
              <Button size="lg" variant="outline" className="min-w-[240px] h-14 text-lg font-semibold border-2 hover:bg-gray-50">
                Share Your Agent
              </Button>
            </Link>
          </div>

          {/* Trending Agents */}
          <div className="animate-in">
            <div className="flex justify-end items-center mb-8">
              <Link href="/browse" className="hidden md:block">
                <Button variant="outline" size="sm">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  name: "Financial Statement Analyzer",
                  description: "Automatically analyze financial statements for anomalies and compliance issues with advanced ML",
                  author: "John Doe",
                  platform: ["OpenAI", "Claude"],
                  rating: 4.9,
                  downloads: 234,
                  trending: true
                },
                {
                  name: "SOX Compliance Checker",
                  description: "Comprehensive SOX compliance verification with automated report generation",
                  author: "Jane Smith",
                  platform: ["Gemini", "LangChain"],
                  rating: 4.7,
                  downloads: 189,
                  trending: true
                },
                {
                  name: "Risk Assessment Matrix",
                  description: "Create detailed risk assessments with automated scoring and visualization",
                  author: "Mike Johnson",
                  platform: ["Claude", "Copilot"],
                  rating: 4.8,
                  downloads: 312,
                  trending: true
                }
              ].map((agent, idx) => (
                <Card key={idx} className="group border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <CardTitle className="text-xl font-bold group-hover:text-purple-600 transition-colors">
                        {agent.name}
                      </CardTitle>
                      {agent.trending && (
                        <div className="flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-semibold">
                          <TrendingUp className="h-3 w-3" />
                          Trending
                        </div>
                      )}
                    </div>
                    <CardDescription className="line-clamp-2 text-gray-600">
                      {agent.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-semibold">{agent.rating}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Users className="h-4 w-4" />
                        {agent.downloads} users
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {agent.platform.map((p) => (
                        <span key={p} className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">
                          {p}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gray-300"></div>
                        <span className="text-sm text-gray-600">{agent.author}</span>
                      </div>
                      <Link href={`/agents/${idx + 1}`}>
                        <Button size="sm" variant="ghost" className="group-hover:bg-purple-100 group-hover:text-purple-700">
                          View Details
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* Categories Section */}
      <section className="py-32 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-black mb-4">
              Explore by Category
            </h2>
            <p className="text-xl text-gray-600">
              Find the perfect AI agent for your specific audit needs
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: "Financial Audit", count: 124, color: "purple" },
              { name: "Compliance", count: 89, color: "pink" },
              { name: "Risk Assessment", count: 67, color: "blue" },
              { name: "Internal Controls", count: 45, color: "green" },
              { name: "Data Analysis", count: 98, color: "yellow" },
              { name: "Report Generation", count: 76, color: "red" },
              { name: "Process Automation", count: 112, color: "indigo" },
              { name: "Document Review", count: 54, color: "orange" }
            ].map((category) => (
              <Link key={category.name} href={`/browse?category=${encodeURIComponent(category.name)}`}>
                <Card className="group cursor-pointer border-2 hover:border-purple-300 transition-all duration-200 hover:shadow-xl h-full">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-lg group-hover:text-purple-600 transition-colors">
                        {category.name}
                      </h3>
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="text-sm text-gray-500">{category.count} agents</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works - Hidden */}
      {/* <section className="py-32 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-black mb-4">
              Get Started in Minutes
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Three simple steps to transform your audit workflow with AI
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "01",
                title: "Browse & Discover",
                description: "Explore our curated collection of AI agents tailored for audit professionals",
                icon: Search
              },
              {
                step: "02",
                title: "Download & Customize",
                description: "Get detailed instructions to recreate agents on your preferred AI platform",
                icon: Zap
              },
              {
                step: "03",
                title: "Deploy & Scale",
                description: "Implement agents in your workflow and see immediate productivity gains",
                icon: TrendingUp
              }
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center h-20 w-20 bg-purple-100 rounded-3xl mb-6">
                    <item.icon className="h-10 w-10 text-purple-600" />
                  </div>
                  <div className="text-6xl font-black text-gray-100 absolute top-0 left-1/2 -translate-x-1/2 -z-10">
                    {item.step}
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
                {idx < 2 && (
                  <div className="hidden md:block absolute top-10 right-0 translate-x-1/2 w-full">
                    <div className="border-t-2 border-dashed border-gray-300 w-full"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* CTA Section */}
      <section className="py-32 px-4 bg-purple-600 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-black mb-6">
            Ready to 10x Your Audit Efficiency?
          </h2>
          <p className="text-xl mb-12 max-w-2xl mx-auto opacity-90">
            Join other audit innovators leveraging AI to deliver better, faster, and more accurate audits.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="min-w-[240px] h-14 text-lg font-semibold bg-white text-purple-600 hover:bg-gray-100">
                Start Free Today
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}