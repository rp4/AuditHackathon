"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  BarChart3,
  Bot,
  Download,
  Edit,
  Eye,
  Heart,
  MoreVertical,
  Plus,
  Settings,
  Star,
  ThumbsUp,
  TrendingUp,
  Upload,
  User
} from "lucide-react"

// Mock data
const userStats = {
  totalAgents: 12,
  totalDownloads: 1234,
  totalUpvotes: 456,
  avgRating: 4.7,
  favoritesSaved: 28,
  reputationScore: 892
}

const userAgents = [
  {
    id: "1",
    name: "Financial Statement Analyzer",
    status: "published",
    downloads: 234,
    upvotes: 89,
    rating: 4.9,
    lastUpdated: "2 days ago"
  },
  {
    id: "2",
    name: "SOX Compliance Checker",
    status: "published",
    downloads: 189,
    upvotes: 67,
    rating: 4.7,
    lastUpdated: "1 week ago"
  },
  {
    id: "3",
    name: "Risk Assessment Matrix",
    status: "draft",
    downloads: 0,
    upvotes: 0,
    rating: 0,
    lastUpdated: "3 hours ago"
  }
]

const recentActivity = [
  { type: "download", user: "John Doe", agent: "Financial Statement Analyzer", time: "2 hours ago" },
  { type: "upvote", user: "Sarah Wilson", agent: "SOX Compliance Checker", time: "5 hours ago" },
  { type: "comment", user: "Mike Chen", agent: "Financial Statement Analyzer", time: "1 day ago" },
  { type: "download", user: "Emily Davis", agent: "SOX Compliance Checker", time: "2 days ago" },
]

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Manage your agents and track performance</p>
        </div>
        <Link href="/add">
          <Button className="mt-4 md:mt-0">
            <Plus className="h-4 w-4 mr-2" />
            Upload New Agent
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Agents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.totalAgents}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +2 this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Downloads</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.totalDownloads.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +15% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Upvotes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.totalUpvotes}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +23 this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average Rating</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{userStats.avgRating}</div>
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Based on 156 reviews</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b mb-6">
        <div className="flex gap-6">
          {["overview", "my-agents", "favorites", "analytics", "settings"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-1 text-sm font-medium capitalize border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.replace("-", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* My Agents */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>My Agents</CardTitle>
                  <Link href="/dashboard/agents">
                    <Button variant="ghost" size="sm">View All</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userAgents.map((agent) => (
                    <div key={agent.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Link href={`/agents/${agent.id}`} className="font-medium hover:text-primary">
                            {agent.name}
                          </Link>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            agent.status === "published"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}>
                            {agent.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Download className="h-3 w-3" />
                            {agent.downloads}
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" />
                            {agent.upvotes}
                          </span>
                          {agent.rating > 0 && (
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              {agent.rating}
                            </span>
                          )}
                          <span>Updated {agent.lastUpdated}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.map((activity, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-sm">
                      <div className="mt-0.5">
                        {activity.type === "download" && <Download className="h-4 w-4 text-blue-500" />}
                        {activity.type === "upvote" && <ThumbsUp className="h-4 w-4 text-green-500" />}
                        {activity.type === "comment" && <Bot className="h-4 w-4 text-purple-500" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">{activity.user}</span>
                          {activity.type === "download" && " downloaded"}
                          {activity.type === "upvote" && " upvoted"}
                          {activity.type === "comment" && " commented on"}
                          {" "}
                          <span className="font-medium text-foreground">{activity.agent}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Profile Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Profile Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center font-semibold">
                    JD
                  </div>
                  <div>
                    <p className="font-medium">John Doe</p>
                    <p className="text-sm text-muted-foreground">john@example.com</p>
                  </div>
                </div>
                <div className="pt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reputation</span>
                    <span className="font-medium">{userStats.reputationScore}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Member Since</span>
                    <span className="font-medium">Nov 2024</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Favorites</span>
                    <span className="font-medium">{userStats.favoritesSaved}</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "my-agents" && (
        <Card>
          <CardHeader>
            <CardTitle>My Agents</CardTitle>
            <CardDescription>Manage all your uploaded agents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userAgents.map((agent) => (
                <div key={agent.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Link href={`/agents/${agent.id}`} className="font-medium hover:text-primary">
                        {agent.name}
                      </Link>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        agent.status === "published"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {agent.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        {agent.downloads} downloads
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" />
                        {agent.upvotes} upvotes
                      </span>
                      {agent.rating > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {agent.rating} rating
                        </span>
                      )}
                      <span>Updated {agent.lastUpdated}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "favorites" && (
        <Card>
          <CardHeader>
            <CardTitle>Favorite Agents</CardTitle>
            <CardDescription>Agents you've saved for later</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-base">Sample Agent {i}</CardTitle>
                    <CardDescription className="text-xs">
                      by Author Name
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">4.8</span>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Heart className="h-4 w-4 fill-current text-red-500" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "analytics" && (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
              <CardDescription>Track your agents' performance over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <BarChart3 className="h-16 w-16" />
                <span className="ml-4">Analytics charts will be displayed here</span>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Performing Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {userAgents.slice(0, 3).map((agent, idx) => (
                    <div key={agent.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg text-muted-foreground">#{idx + 1}</span>
                        <span className="text-sm font-medium">{agent.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {agent.downloads} downloads
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        ))}
                        <span className="text-sm ml-2 font-medium">User {i}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        Great agent, very helpful for financial audits!
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Manage your account settings and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Display Name</label>
                <Input defaultValue="John Doe" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input type="email" defaultValue="john@example.com" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Bio</label>
                <textarea
                  className="w-full min-h-[100px] px-3 py-2 border rounded-md text-sm"
                  defaultValue="Senior auditor with expertise in financial compliance and automation."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Expertise Areas</label>
                <div className="flex flex-wrap gap-2">
                  {["Financial Audit", "Compliance", "Risk Assessment", "Automation"].map((area) => (
                    <span key={area} className="px-3 py-1 bg-muted rounded-md text-sm">
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button>Save Changes</Button>
                <Button variant="outline">Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}