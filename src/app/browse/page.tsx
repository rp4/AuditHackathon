"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronDown, Filter, Grid, List, Search, Star, Download, ArrowUpDown } from "lucide-react"
import Link from "next/link"

// Mock data for agents
const mockAgents = [
  {
    id: "1",
    name: "Financial Statement Analyzer",
    description: "Automatically analyze financial statements for anomalies and compliance issues with advanced pattern recognition",
    platforms: ["OpenAI", "Claude"],
    category: "Financial Audit",
    rating: 4.9,
    downloads: 234,
    author: "John Doe",
    updated: "2 days ago"
  },
  {
    id: "2",
    name: "SOX Compliance Checker",
    description: "Verify SOX compliance requirements and generate comprehensive audit reports",
    platforms: ["Gemini", "LangChain"],
    category: "Compliance",
    rating: 4.7,
    downloads: 189,
    author: "Jane Smith",
    updated: "1 week ago"
  },
  {
    id: "3",
    name: "Risk Assessment Matrix",
    description: "Create comprehensive risk assessments with automated scoring and heat map visualization",
    platforms: ["Claude", "Copilot"],
    category: "Risk Assessment",
    rating: 4.8,
    downloads: 312,
    author: "Mike Johnson",
    updated: "3 days ago"
  },
  {
    id: "4",
    name: "Internal Control Tester",
    description: "Automated testing of internal controls with detailed documentation",
    platforms: ["OpenAI"],
    category: "Internal Controls",
    rating: 4.6,
    downloads: 156,
    author: "Sarah Wilson",
    updated: "5 days ago"
  },
  {
    id: "5",
    name: "Fraud Detection Agent",
    description: "Advanced fraud detection using pattern analysis and machine learning",
    platforms: ["Claude", "Gemini"],
    category: "Risk Assessment",
    rating: 4.9,
    downloads: 421,
    author: "Alex Brown",
    updated: "1 day ago"
  },
  {
    id: "6",
    name: "Audit Report Generator",
    description: "Generate professional audit reports with customizable templates",
    platforms: ["OpenAI", "LangChain"],
    category: "Report Generation",
    rating: 4.5,
    downloads: 278,
    author: "Emily Davis",
    updated: "2 weeks ago"
  }
]

const categories = [
  "All Categories",
  "Financial Audit",
  "Compliance",
  "Risk Assessment",
  "Internal Controls",
  "Data Analysis",
  "Report Generation",
  "Process Automation",
  "Document Review"
]

const platforms = [
  "All Platforms",
  "OpenAI",
  "Claude",
  "Gemini",
  "LangChain",
  "Copilot"
]

export default function BrowsePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [minRating, setMinRating] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState("popular")
  const [showFilters, setShowFilters] = useState(true)

  // Filter agents based on search and filters
  const filteredAgents = mockAgents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         agent.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(agent.category)
    const matchesPlatform = selectedPlatforms.length === 0 ||
                           agent.platforms.some(platform => selectedPlatforms.includes(platform))
    const matchesRating = minRating === null || agent.rating >= minRating

    return matchesSearch && matchesCategory && matchesPlatform && matchesRating
  })

  // Sort agents
  const sortedAgents = [...filteredAgents].sort((a, b) => {
    switch (sortBy) {
      case "popular":
        return b.downloads - a.downloads
      case "rating":
        return b.rating - a.rating
      case "recent":
        return 0 // Would use actual dates in production
      default:
        return 0
    }
  })

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Browse AI Agents</h1>
        <p className="text-muted-foreground">
          Discover and implement AI agents created by the audit community
        </p>
      </div>

      {/* Search and Controls */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="search"
            placeholder="Search agents by name or description..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <select
            className="px-4 py-2 border rounded-md text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="popular">Most Popular</option>
            <option value="rating">Highest Rated</option>
            <option value="recent">Most Recent</option>
          </select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          >
            {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Filters Sidebar */}
        <aside className={`w-64 flex-shrink-0 ${showFilters ? "block" : "hidden"} lg:block`}>
          <div className="space-y-6">
            {/* Category Filter */}
            <div>
              <h3 className="font-semibold mb-3">Category</h3>
              <div className="space-y-2">
                {categories.filter(c => c !== "All Categories").map((category) => (
                  <label key={category} className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      value={category}
                      checked={selectedCategories.includes(category)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCategories([...selectedCategories, category])
                        } else {
                          setSelectedCategories(selectedCategories.filter(c => c !== category))
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">{category}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Platform Filter */}
            <div>
              <h3 className="font-semibold mb-3">Platform</h3>
              <div className="space-y-2">
                {platforms.filter(p => p !== "All Platforms").map((platform) => (
                  <label key={platform} className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      value={platform}
                      checked={selectedPlatforms.includes(platform)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPlatforms([...selectedPlatforms, platform])
                        } else {
                          setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform))
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">{platform}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Rating Filter */}
            <div>
              <h3 className="font-semibold mb-3">Minimum Rating</h3>
              <div className="space-y-2">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="rating"
                    checked={minRating === null}
                    onChange={() => setMinRating(null)}
                    className="mr-2"
                  />
                  <span className="text-sm">All Ratings</span>
                </label>
                {[4, 3, 2, 1].map((rating) => (
                  <label key={rating} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="rating"
                      checked={minRating === rating}
                      onChange={() => setMinRating(rating)}
                      className="mr-2"
                    />
                    <div className="flex items-center">
                      {Array.from({ length: rating }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      ))}
                      <span className="ml-1 text-sm">& up</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Agents Grid/List */}
        <div className="flex-1">
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {sortedAgents.length} agents
          </div>

          {viewMode === "grid" ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {sortedAgents.map((agent) => (
                <Link key={agent.id} href={`/agents/${agent.id}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {agent.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {agent.platforms.map((platform) => (
                          <span key={platform} className="text-xs bg-muted px-2 py-1 rounded">
                            {platform}
                          </span>
                        ))}
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{agent.rating}</span>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        by {agent.author} • {agent.updated}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {sortedAgents.map((agent) => (
                <Link key={agent.id} href={`/agents/${agent.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{agent.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {agent.description}
                          </CardDescription>
                        </div>
                        <div className="ml-4 text-right">
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{agent.rating}</span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                          {agent.platforms.map((platform) => (
                            <span key={platform} className="text-xs bg-muted px-2 py-1 rounded">
                              {platform}
                            </span>
                          ))}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          by {agent.author} • {agent.updated}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          <div className="mt-8 flex justify-center">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">
                1
              </Button>
              <Button variant="outline" size="sm">
                2
              </Button>
              <Button variant="outline" size="sm">
                3
              </Button>
              <Button variant="outline" size="sm">
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}