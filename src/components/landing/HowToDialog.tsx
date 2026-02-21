"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Copy, Check, Download, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { WORKFLOW_GENERATION_PROMPT } from "@/lib/constants/prompts"

interface HowToDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function StepNumber({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold shrink-0">
      {n}
    </span>
  )
}

export function HowToDialog({ open, onOpenChange }: HowToDialogProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(WORKFLOW_GENERATION_PROMPT)
      setCopied(true)
      toast.success("AI prompt copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Failed to copy prompt")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>How to Generate Workflows with AI</DialogTitle>
          <DialogDescription>
            Choose your preferred AI tool and follow the steps below.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="copilot" className="flex-1 min-h-0">
          <TabsList className="w-full">
            <TabsTrigger value="copilot" className="text-xs sm:text-sm flex-1 data-[state=active]:bg-amber-500 data-[state=active]:text-white">
              Copilot & ChatGPT
            </TabsTrigger>
            <TabsTrigger value="claude" className="text-xs sm:text-sm flex-1 data-[state=active]:bg-amber-500 data-[state=active]:text-white">
              Claude
            </TabsTrigger>
            <TabsTrigger value="gemini" className="text-xs sm:text-sm flex-1 data-[state=active]:bg-amber-500 data-[state=active]:text-white">
              Gemini & Others
            </TabsTrigger>
          </TabsList>

          {/* Copilot & ChatGPT Tab */}
          <TabsContent
            value="copilot"
            className="overflow-y-auto pr-2 space-y-6 mt-4"
          >
            <div className="flex gap-3">
              <StepNumber n={1} />
              <div>
                <p className="font-semibold text-sm">
                  Create a Custom GPT or Copilot Agent
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  In ChatGPT: Explore GPTs &rarr; Create. In Copilot: Copilot
                  Studio &rarr; Create Agent.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <StepNumber n={2} />
              <div>
                <p className="font-semibold text-sm">Set the System Prompt</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Copy the prompt below and paste it as the GPT/Agent system
                  instructions.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={handleCopyPrompt}
                >
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Prompt
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="flex gap-3">
              <StepNumber n={3} />
              <div>
                <p className="font-semibold text-sm">
                  Upload the Script to Knowledge
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Download the Python script and upload it as a
                  knowledge/attached file for the agent.
                </p>
                <a href="/apps/workflow-generate.py.txt" download>
                  <Button variant="outline" size="sm" className="mt-2">
                    <Download className="mr-2 h-4 w-4" />
                    workflow-generate.py.txt
                  </Button>
                </a>
              </div>
            </div>

            <div className="flex gap-3">
              <StepNumber n={4} />
              <div>
                <p className="font-semibold text-sm">Use It</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload audit documents (RCMs, IIA standards, NIST, etc.). Ask
                  the agent to parse and generate a workflow. It will execute the
                  script and output a standalone HTML file.
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Claude Tab */}
          <TabsContent
            value="claude"
            className="overflow-y-auto pr-2 space-y-6 mt-4"
          >
            <Badge
              variant="outline"
              className="border-amber-300 bg-amber-50 text-amber-700"
            >
              Recommended
            </Badge>

            <div className="flex gap-3">
              <StepNumber n={1} />
              <div>
                <p className="font-semibold text-sm">Download the Skill</p>
                <p className="text-sm text-muted-foreground mt-1">
                  This skill bundles the prompt, reference docs, and the Python
                  script.
                </p>
                <a href="/apps/audit-workflow-generator.skill" download>
                  <Button variant="outline" size="sm" className="mt-2">
                    <Download className="mr-2 h-4 w-4" />
                    audit-workflow-generator.skill
                  </Button>
                </a>
              </div>
            </div>

            <div className="flex gap-3">
              <StepNumber n={2} />
              <div>
                <p className="font-semibold text-sm">Install in Claude</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add the skill to Claude. It works with Claude Desktop, Web,
                  and Code.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <StepNumber n={3} />
              <div>
                <p className="font-semibold text-sm">Use It</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Provide audit documents in the conversation. The skill
                  auto-generates workflow JSON and renders an interactive HTML
                  file.
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground border-t pt-4">
              The skill also includes{" "}
              <a
                href="/apps/workflow-generate.py.txt"
                download
                className="underline underline-offset-2 hover:text-foreground"
              >
                workflow-generate.py.txt
              </a>{" "}
              for standalone use.
            </p>
          </TabsContent>

          {/* Gemini & Others Tab */}
          <TabsContent
            value="gemini"
            className="overflow-y-auto pr-2 space-y-6 mt-4"
          >
            <div className="flex gap-3">
              <StepNumber n={1} />
              <div>
                <p className="font-semibold text-sm">Copy the Prompt</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Copy the workflow generation prompt to your clipboard.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={handleCopyPrompt}
                >
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Prompt
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="flex gap-3">
              <StepNumber n={2} />
              <div>
                <p className="font-semibold text-sm">Start a Conversation</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Paste the prompt into Gemini (or any other AI tool). Upload
                  your audit documents.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <StepNumber n={3} />
              <div>
                <p className="font-semibold text-sm">Generate the Workflow</p>
                <p className="text-sm text-muted-foreground mt-1">
                  The AI will output workflow JSON based on your documents.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <StepNumber n={4} />
              <div>
                <p className="font-semibold text-sm">Import to AuditSwarm</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Go to the Create page &rarr; click &ldquo;Import&rdquo;
                  &rarr; paste the JSON. The workflow renders on the canvas.
                </p>
                <Link href="/create" onClick={() => onOpenChange(false)}>
                  <Button variant="outline" size="sm" className="mt-2">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Go to Create
                  </Button>
                </Link>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
