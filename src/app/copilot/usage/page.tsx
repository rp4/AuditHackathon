'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  DollarSign,
  Zap,
  TrendingUp,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react'

type DatePreset = '7d' | '30d' | '90d' | 'all'

interface CurrentMonth {
  spend: number
  limit: number | null
  remaining: number | null
  periodStart: string
  periodEnd: string
}

interface UsageRecord {
  id: string
  model: string
  promptTokens: number
  outputTokens: number
  totalTokens: number
  estimatedCost: number
  sessionId: string | null
  createdAt: string
}

interface UsageResponse {
  userId: string
  userEmail: string
  currentMonth: CurrentMonth
  records: UsageRecord[]
}

function getDateRange(preset: DatePreset): { startDate?: string; endDate?: string } {
  if (preset === 'all') return {}
  const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90
  const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  }
}

function formatCost(cost: number): string {
  if (cost < 0.01) return `$${cost.toFixed(6)}`
  if (cost < 1) return `$${cost.toFixed(4)}`
  return `$${cost.toFixed(2)}`
}

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`
  return tokens.toString()
}

function getBudgetColor(ratio: number): string {
  if (ratio >= 1) return 'bg-red-500'
  if (ratio >= 0.8) return 'bg-yellow-500'
  return 'bg-green-500'
}

function getBudgetTextColor(ratio: number): string {
  if (ratio >= 1) return 'text-red-600 dark:text-red-400'
  if (ratio >= 0.8) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-green-600 dark:text-green-400'
}

export default function UsagePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<UsageResponse | null>(null)
  const [datePreset, setDatePreset] = useState<DatePreset>('30d')

  useEffect(() => {
    if (status !== 'loading' && !session?.user) {
      router.replace('/copilot')
    }
  }, [session, status, router])

  const fetchUsage = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const range = getDateRange(datePreset)
      const params = new URLSearchParams()
      if (range.startDate) params.set('startDate', range.startDate)
      if (range.endDate) params.set('endDate', range.endDate)

      const response = await fetch(`/api/copilot/usage?${params}`)

      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: 'Request failed' }))
        throw new Error(body.error || `HTTP ${response.status}`)
      }

      setData(await response.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch usage data')
    } finally {
      setLoading(false)
    }
  }, [datePreset])

  useEffect(() => {
    if (session?.user) fetchUsage()
  }, [session, fetchUsage])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const currentMonth = data?.currentMonth
  const budgetRatio = currentMonth?.limit ? currentMonth.spend / currentMonth.limit : 0
  const resetDate = currentMonth?.periodEnd
    ? new Date(currentMonth.periodEnd)
    : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/copilot')}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Usage</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Your Gemini API usage and spending
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              {(['7d', '30d', '90d', 'all'] as DatePreset[]).map((preset) => (
                <button
                  key={preset}
                  onClick={() => setDatePreset(preset)}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    datePreset === preset
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {preset === 'all' ? 'All' : preset}
                </button>
              ))}
            </div>
            <button
              onClick={fetchUsage}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 text-gray-600 dark:text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Budget Progress Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Monthly Budget</h2>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Resets {resetDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          {currentMonth?.limit !== null && currentMonth?.limit !== undefined ? (
            <>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formatCost(currentMonth.spend)}
                </span>
                <span className="text-lg text-gray-500 dark:text-gray-400">
                  / {formatCost(currentMonth.limit)}
                </span>
              </div>

              <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getBudgetColor(budgetRatio)}`}
                  style={{ width: `${Math.min(100, budgetRatio * 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${getBudgetTextColor(budgetRatio)}`}>
                  {budgetRatio >= 1 ? (
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      Limit reached
                    </span>
                  ) : (
                    `${Math.round(budgetRatio * 100)}% used`
                  )}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {currentMonth.remaining !== null
                    ? `${formatCost(currentMonth.remaining)} remaining`
                    : ''}
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatCost(currentMonth?.spend ?? 0)}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">this month</span>
              <span className="ml-auto text-sm text-gray-400 dark:text-gray-500">No limit set</span>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <SummaryCard
            icon={<DollarSign className="w-5 h-5" />}
            label="Period Spend"
            value={formatCost(data?.records?.reduce((sum, r) => sum + r.estimatedCost, 0) ?? 0)}
            iconColor="text-green-600"
          />
          <SummaryCard
            icon={<Zap className="w-5 h-5" />}
            label="API Calls"
            value={(data?.records?.length ?? 0).toLocaleString()}
            iconColor="text-yellow-600"
          />
          <SummaryCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Total Tokens"
            value={formatTokens(data?.records?.reduce((sum, r) => sum + r.promptTokens + r.outputTokens, 0) ?? 0)}
            iconColor="text-purple-600"
          />
        </div>

        {/* Recent API Calls */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent API Calls
            </h2>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
              Loading usage data...
            </div>
          ) : !data?.records || data.records.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
              No usage data found for the selected period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Model
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Input
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Output
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Cost
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {data.records.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-3 text-gray-700 dark:text-gray-300 font-mono text-xs">
                        {new Date(record.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                            record.model.includes('pro')
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}
                        >
                          {record.model.replace('gemini-', '').replace('-preview', '')}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right text-gray-700 dark:text-gray-300 font-mono">
                        {formatTokens(record.promptTokens)}
                      </td>
                      <td className="px-6 py-3 text-right text-gray-700 dark:text-gray-300 font-mono">
                        {formatTokens(record.outputTokens)}
                      </td>
                      <td className="px-6 py-3 text-right font-semibold text-gray-900 dark:text-white font-mono">
                        {formatCost(record.estimatedCost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.records.length >= 500 && (
                <div className="px-6 py-3 text-xs text-gray-400 dark:text-gray-500 text-center border-t border-gray-200 dark:border-gray-700">
                  Showing most recent 500 records
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SummaryCard({
  icon,
  label,
  value,
  iconColor,
}: {
  icon: React.ReactNode
  label: string
  value: string
  iconColor: string
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
        <span className={iconColor}>{icon}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
    </div>
  )
}
