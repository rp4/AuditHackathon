'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Loader2, Users, Package, TrendingUp, Eye, Heart, Star, Clock } from 'lucide-react'
import FeaturedToolsManager from './FeaturedToolsManager'

interface Stats {
  overview: {
    totalUsers: number
    newUsers: number
    activeUsers: number
    totalSwarms: number
    newSwarms: number
  }
  topViewedSwarms: any[]
  topFavoritedSwarms: any[]
  recentProfiles: any[]
  charts: {
    userGrowth: Array<{ date: string; count: number }>
    swarmGrowth: Array<{ date: string; count: number }>
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [timeframe, setTimeframe] = useState('30d')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [timeframe])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/stats?timeframe=${timeframe}`)
      if (!response.ok) throw new Error('Failed to fetch stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!stats) {
    return <div>Failed to load statistics</div>
  }

  return (
    <div className="space-y-6">
      {/* Timeframe Selector */}
      <div className="flex justify-end">
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.overview.newUsers} new
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.activeUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.overview.activeUsers / stats.overview.totalUsers) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tools</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.totalSwarms.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.overview.newSwarms} new
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Tools/User</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.overview.totalSwarms / stats.overview.totalUsers).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Per user</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((stats.overview.activeUsers / stats.overview.totalUsers) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Active users</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="tools" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tools">Top Tools</TabsTrigger>
          <TabsTrigger value="users">Recent Users</TabsTrigger>
          <TabsTrigger value="featured">Featured Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="tools" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Top Viewed Tools */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Most Viewed Tools
                </CardTitle>
                <CardDescription>Tools with the most views</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.topViewedSwarms.map((tool, index) => (
                    <div key={tool.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground w-6">
                          #{index + 1}
                        </span>
                        <div>
                          <p className="font-medium">{tool.name}</p>
                          <p className="text-xs text-muted-foreground">
                            by {tool.user.name || tool.user.username}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {tool.views_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {tool.favorites_count}
                        </span>
                        {tool.rating_avg > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            {tool.rating_avg.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Favorited Tools */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Most Favorited Tools
                </CardTitle>
                <CardDescription>Tools with the most favorites</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.topFavoritedSwarms.map((tool, index) => (
                    <div key={tool.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground w-6">
                          #{index + 1}
                        </span>
                        <div>
                          <p className="font-medium">{tool.name}</p>
                          <p className="text-xs text-muted-foreground">
                            by {tool.user.name || tool.user.username}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {tool.favorites_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {tool.views_count}
                        </span>
                        {tool.rating_avg > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            {tool.rating_avg.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent User Profiles</CardTitle>
              <CardDescription>Newly registered users on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.recentProfiles.map((user) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{user.name || 'Unnamed User'}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      {user.username && (
                        <Badge variant="outline" className="mt-1">
                          @{user.username}
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="secondary">{user._count.swarms} swarms</Badge>
                        <Badge variant="secondary">{user._count.favorites} favorites</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="featured" className="space-y-4">
          <FeaturedToolsManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}