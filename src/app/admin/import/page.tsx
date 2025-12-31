'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Upload, Loader2, FileJson, CheckCircle, XCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import type { WorkflowExport } from '@/types/workflow'
import { nodesNeedLayout } from '@/lib/utils/workflowLayout'

interface ImportResult {
  name: string
  success: boolean
  error?: string
  slug?: string
}

export default function AdminImportPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [previewData, setPreviewData] = useState<WorkflowExport | null>(null)
  const [importResults, setImportResults] = useState<ImportResult[]>([])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.json')) {
      toast.error('Please upload a JSON file')
      return
    }

    try {
      const text = await file.text()
      const data = JSON.parse(text) as WorkflowExport

      if (!data.version || !data.data?.workflows) {
        toast.error('Invalid workflow export format')
        return
      }

      setPreviewData(data)
      setImportResults([])
      toast.success(`Found ${data.data.workflows.length} workflow(s) to import`)
    } catch (error) {
      toast.error('Failed to parse JSON file')
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }, [handleFile])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }, [handleFile])

  const handleImport = async () => {
    if (!previewData) return

    setLoading(true)
    setImportResults([])

    try {
      const response = await fetch('/api/admin/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(previewData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to import workflows')
      }

      setImportResults(result.results)

      const successCount = result.results.filter((r: ImportResult) => r.success).length
      const failCount = result.results.filter((r: ImportResult) => !r.success).length

      if (failCount === 0) {
        toast.success(`Successfully imported ${successCount} workflow(s)`)
      } else {
        toast.warning(`Imported ${successCount} workflow(s), ${failCount} failed`)
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to import workflows')
    } finally {
      setLoading(false)
    }
  }

  const clearPreview = () => {
    setPreviewData(null)
    setImportResults([])
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-20">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You need to be signed in to access this page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link href="/browse">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Browse
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Import Workflows</CardTitle>
          <CardDescription>
            Import workflow templates from a JSON file exported from AuditSwarm or other compatible sources.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload Area */}
          <div className="space-y-2">
            <Label>Upload JSON File</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <FileJson className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Drag and drop a JSON file here, or click to select
              </p>
              <input
                type="file"
                accept=".json"
                onChange={handleChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button variant="outline" asChild>
                  <span className="cursor-pointer">
                    <Upload className="mr-2 h-4 w-4" />
                    Choose File
                  </span>
                </Button>
              </label>
            </div>
          </div>

          {/* Preview */}
          {previewData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Preview ({previewData.data.workflows.length} workflow(s))</Label>
                <Button variant="ghost" size="sm" onClick={clearPreview}>
                  Clear
                </Button>
              </div>
              <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
                {previewData.data.workflows.map((workflow, index) => {
                  const result = importResults.find(r => r.name === workflow.name)
                  const willAutoLayout = nodesNeedLayout(workflow.diagramJson?.nodes || [])
                  return (
                    <div key={index} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{workflow.name}</p>
                        {workflow.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {workflow.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {workflow.diagramJson?.nodes?.length || 0} nodes, {workflow.diagramJson?.edges?.length || 0} edges
                          {willAutoLayout && (
                            <span className="ml-2 text-amber-600">(auto-layout will apply)</span>
                          )}
                        </p>
                      </div>
                      {result && (
                        <div className="flex items-center gap-2">
                          {result.success ? (
                            <>
                              <CheckCircle className="h-5 w-5 text-green-500" />
                              {result.slug && (
                                <Link href={`/swarms/${result.slug}`}>
                                  <Button variant="link" size="sm">View</Button>
                                </Link>
                              )}
                            </>
                          ) : (
                            <div className="flex items-center gap-2 text-red-500">
                              <XCircle className="h-5 w-5" />
                              <span className="text-sm">{result.error}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Import Button */}
              <Button
                onClick={handleImport}
                disabled={loading || importResults.length > 0}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : importResults.length > 0 ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Import Complete
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import {previewData.data.workflows.length} Workflow(s)
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Expected Format Info */}
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-medium mb-2">Expected JSON Format:</p>
            <pre className="text-xs bg-background p-3 rounded overflow-x-auto">
{`{
  "version": "1.0",
  "data": {
    "workflows": [{
      "name": "Workflow Name",
      "description": "Description...",
      "diagramJson": {
        "nodes": [...],
        "edges": [...],
        "metadata": { "phase": "...", "standard": "..." }
      }
    }]
  }
}`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
