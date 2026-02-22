'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  DollarSign,
  Zap,
  Users,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Shield,
  Pencil,
  Check,
  X,
} from 'lucide-react'

type DatePreset = '7d' | '30d' | '90d' | 'all'

interface UserUsageSummary {
  userId: string
  userEmail: string
  totalCalls: number
  promptTokens: number
  outputTokens: number
  estimatedCost: number
  byModel: Record<string, { calls: number; promptTokens: number; outputTokens: number; cost: number }>
}

interface UserDetailRecord {
  id: string
  model: string
  promptTokens: number
  outputTokens: number
  totalTokens: number
  estimatedCost: number
  sessionId: string | null
  createdAt: string
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

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usageData, setUsageData] = useState<UserUsageSummary[]>([])
  const [datePreset, setDatePreset] = useState<DatePreset>('30d')
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const [userRecords, setUserRecords] = useState<UserDetailRecord[]>([])
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [userLimits, setUserLimits] = useState<Map<string, number>>(new Map())
  const [editingLimit, setEditingLimit] = useState<string | null>(null)
  const [editLimitValue, setEditLimitValue] = useState('')
  const [savingLimit, setSavingLimit] = useState(false)

  const fetchUsageData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const range = getDateRange(datePreset)
      const params = new URLSearchParams()
      if (range.startDate) params.set('startDate', range.startDate)
      if (range.endDate) params.set('endDate', range.endDate)

      const [usageResponse, limitsResponse] = await Promise.all([
        fetch(`/api/copilot/admin/usage?${params}`),
        fetch('/api/copilot/admin/limits'),
      ])

      if (!usageResponse.ok) {
        const body = await usageResponse.json().catch(() => ({ error: 'Request failed' }))
        throw new Error(body.error || `HTTP ${usageResponse.status}`)
      }

      const data = await usageResponse.json()
      setUsageData(Array.isArray(data) ? data : [])

      if (limitsResponse.ok) {
        const limits = await limitsResponse.json()
        const limitsMap = new Map<string, number>()
        if (Array.isArray(limits)) {
          for (const l of limits) {
            limitsMap.set(l.userId, l.monthlyLimit)
          }
        }
        setUserLimits(limitsMap)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch usage data')
    } finally {
      setLoading(false)
    }
  }, [datePreset])

  const saveLimit = async (userId: string, userEmail: string) => {
    const value = parseFloat(editLimitValue)
    if (isNaN(value) || value < 0) return

    setSavingLimit(true)
    try {
      const response = await fetch('/api/copilot/admin/limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userEmail, monthlyLimit: value }),
      })

      if (response.ok) {
        setUserLimits((prev) => new Map(prev).set(userId, value))
        setEditingLimit(null)
      }
    } catch {
      // silently fail
    } finally {
      setSavingLimit(false)
    }
  }

  useEffect(() => {
    fetchUsageData()
  }, [fetchUsageData])

  const fetchUserDetail = async (userId: string) => {
    if (expandedUser === userId) {
      setExpandedUser(null)
      return
    }

    setExpandedUser(userId)
    setLoadingDetail(true)
    try {
      const range = getDateRange(datePreset)
      const params = new URLSearchParams({ userId })
      if (range.startDate) params.set('startDate', range.startDate)
      if (range.endDate) params.set('endDate', range.endDate)

      const response = await fetch(`/api/copilot/admin/usage?${params}`)

      if (response.ok) {
        const data = await response.json()
        setUserRecords(data.records || [])
      }
    } catch {
      // silently fail for detail view
    } finally {
      setLoadingDetail(false)
    }
  }

  const totalCost = usageData.reduce((sum, u) => sum + u.estimatedCost, 0)
  const totalCalls = usageData.reduce((sum, u) => sum + u.totalCalls, 0)
  const totalInputTokens = usageData.reduce((sum, u) => sum + u.promptTokens, 0)
  const totalOutputTokens = usageData.reduce((sum, u) => sum + u.outputTokens, 0)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/create')}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                API Usage Dashboard
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Gemini API usage and cost estimates
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
              onClick={fetchUsageData}
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <SummaryCard
            icon={<DollarSign className="w-5 h-5" />}
            label="Estimated Cost"
            value={formatCost(totalCost)}
            iconColor="text-green-600"
          />
          <SummaryCard
            icon={<Zap className="w-5 h-5" />}
            label="API Calls"
            value={totalCalls.toLocaleString()}
            iconColor="text-yellow-600"
          />
          <SummaryCard
            icon={<Users className="w-5 h-5" />}
            label="Active Users"
            value={usageData.length.toString()}
            iconColor="text-blue-600"
          />
          <SummaryCard
            icon={<Zap className="w-5 h-5" />}
            label="Total Tokens"
            value={formatTokens(totalInputTokens + totalOutputTokens)}
            subtitle={`${formatTokens(totalInputTokens)} in / ${formatTokens(totalOutputTokens)} out`}
            iconColor="text-purple-600"
          />
          <SummaryCard
            icon={<Shield className="w-5 h-5" />}
            label="Users with Limits"
            value={`${userLimits.size} / ${usageData.length}`}
            iconColor="text-orange-600"
          />
        </div>

        {/* Usage Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Usage by User
            </h2>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
              Loading usage data...
            </div>
          ) : usageData.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
              No usage data found for the selected period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Calls
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Input Tokens
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Output Tokens
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Est. Cost
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Models
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Monthly Limit
                    </th>
                    <th className="px-6 py-3 w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {usageData.map((user) => (
                    <UserRow
                      key={user.userId}
                      user={user}
                      isExpanded={expandedUser === user.userId}
                      onToggle={() => fetchUserDetail(user.userId)}
                      records={expandedUser === user.userId ? userRecords : []}
                      loadingDetail={loadingDetail && expandedUser === user.userId}
                      monthlyLimit={userLimits.get(user.userId)}
                      isEditingLimit={editingLimit === user.userId}
                      editLimitValue={editingLimit === user.userId ? editLimitValue : ''}
                      savingLimit={savingLimit && editingLimit === user.userId}
                      onStartEditLimit={() => {
                        setEditingLimit(user.userId)
                        setEditLimitValue(
                          userLimits.has(user.userId) ? userLimits.get(user.userId)!.toString() : ''
                        )
                      }}
                      onCancelEditLimit={() => setEditingLimit(null)}
                      onSaveLimit={() => saveLimit(user.userId, user.userEmail)}
                      onEditLimitValueChange={setEditLimitValue}
                    />
                  ))}
                </tbody>
              </table>
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
  subtitle,
  iconColor,
}: {
  icon: React.ReactNode
  label: string
  value: string
  subtitle?: string
  iconColor: string
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {label}
        </span>
        <span className={iconColor}>{icon}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
      {subtitle && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
      )}
    </div>
  )
}

function UserRow({
  user,
  isExpanded,
  onToggle,
  records,
  loadingDetail,
  monthlyLimit,
  isEditingLimit,
  editLimitValue,
  savingLimit,
  onStartEditLimit,
  onCancelEditLimit,
  onSaveLimit,
  onEditLimitValueChange,
}: {
  user: UserUsageSummary
  isExpanded: boolean
  onToggle: () => void
  records: UserDetailRecord[]
  loadingDetail: boolean
  monthlyLimit?: number
  isEditingLimit: boolean
  editLimitValue: string
  savingLimit: boolean
  onStartEditLimit: () => void
  onCancelEditLimit: () => void
  onSaveLimit: () => void
  onEditLimitValueChange: (value: string) => void
}) {
  const modelNames = Object.keys(user.byModel)

  return (
    <>
      <tr
        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
        onClick={onToggle}
      >
        <td className="px-6 py-4">
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {user.userEmail}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
            {user.userId.slice(0, 12)}...
          </div>
        </td>
        <td className="px-6 py-4 text-right text-sm text-gray-700 dark:text-gray-300">
          {user.totalCalls.toLocaleString()}
        </td>
        <td className="px-6 py-4 text-right text-sm text-gray-700 dark:text-gray-300 font-mono">
          {formatTokens(user.promptTokens)}
        </td>
        <td className="px-6 py-4 text-right text-sm text-gray-700 dark:text-gray-300 font-mono">
          {formatTokens(user.outputTokens)}
        </td>
        <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white font-mono">
          {formatCost(user.estimatedCost)}
        </td>
        <td className="px-6 py-4 text-center">
          <div className="flex flex-wrap justify-center gap-1">
            {modelNames.map((model) => (
              <span
                key={model}
                className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                  model.includes('pro')
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                }`}
              >
                {model.replace('gemini-', '').replace('-preview', '')}
              </span>
            ))}
          </div>
        </td>
        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
          {isEditingLimit ? (
            <div className="flex items-center justify-end gap-1">
              <span className="text-sm text-gray-500">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={editLimitValue}
                onChange={(e) => onEditLimitValueChange(e.target.value)}
                className="w-20 px-2 py-1 text-sm text-right border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSaveLimit()
                  if (e.key === 'Escape') onCancelEditLimit()
                }}
              />
              <button
                onClick={onSaveLimit}
                disabled={savingLimit}
                className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={onCancelEditLimit}
                className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-1">
              {monthlyLimit !== undefined && monthlyLimit > 0 ? (
                <span className="text-sm font-mono text-gray-900 dark:text-white">
                  ${monthlyLimit.toFixed(2)}
                </span>
              ) : (
                <span className="text-xs text-gray-400 dark:text-gray-500">No limit</span>
              )}
              <button
                onClick={onStartEditLimit}
                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                title="Set limit"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </td>
        <td className="px-6 py-4 text-center">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </td>
      </tr>

      {isExpanded && (
        <tr>
          <td colSpan={8} className="px-6 py-0">
            <div className="py-4 border-t border-gray-100 dark:border-gray-700/50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                {Object.entries(user.byModel).map(([model, stats]) => (
                  <div
                    key={model}
                    className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3"
                  >
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      {model}
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300">
                        {stats.calls} calls
                      </span>
                      <span className="font-mono font-semibold text-gray-900 dark:text-white">
                        {formatCost(stats.cost)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {loadingDetail ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Loading records...
                </p>
              ) : records.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-gray-500 dark:text-gray-400">
                        <th className="py-1 pr-4 text-left font-medium">Time</th>
                        <th className="py-1 pr-4 text-left font-medium">Model</th>
                        <th className="py-1 pr-4 text-right font-medium">In</th>
                        <th className="py-1 pr-4 text-right font-medium">Out</th>
                        <th className="py-1 text-right font-medium">Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {records.slice(0, 20).map((r) => (
                        <tr key={r.id} className="text-gray-700 dark:text-gray-300">
                          <td className="py-1 pr-4 font-mono">
                            {new Date(r.createdAt).toLocaleString()}
                          </td>
                          <td className="py-1 pr-4">
                            {r.model.replace('gemini-', '')}
                          </td>
                          <td className="py-1 pr-4 text-right font-mono">
                            {r.promptTokens.toLocaleString()}
                          </td>
                          <td className="py-1 pr-4 text-right font-mono">
                            {r.outputTokens.toLocaleString()}
                          </td>
                          <td className="py-1 text-right font-mono">
                            {formatCost(r.estimatedCost)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {records.length > 20 && (
                    <p className="text-xs text-gray-400 mt-2">
                      Showing 20 of {records.length} records
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No individual records found.
                </p>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
