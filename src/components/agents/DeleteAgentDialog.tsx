"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Trash2, AlertTriangle } from "lucide-react"
import { useDeleteAgent } from "@/hooks/useAgents"

interface DeleteAgentDialogProps {
  agentId: string
  agentName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteAgentDialog({
  agentId,
  agentName,
  open,
  onOpenChange,
}: DeleteAgentDialogProps) {
  const router = useRouter()
  const { mutate: deleteAgent, isPending } = useDeleteAgent()
  const [confirmText, setConfirmText] = useState("")

  const handleDelete = () => {
    console.log('🗑️ Attempting to delete agent:', agentId)
    deleteAgent(agentId, {
      onSuccess: () => {
        console.log('✅ Agent deleted successfully')
        toast.success("Agent deleted successfully")
        onOpenChange(false)
        // Redirect to browse page
        router.push("/browse")
      },
      onError: (error: any) => {
        console.error("❌ Error deleting agent:", error)
        toast.error(error.message || "Failed to delete agent. Please try again.")
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete Agent
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your agent
            <span className="font-semibold"> "{agentName}"</span> and remove all associated data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="confirm" className="text-sm font-medium">
              Type <span className="font-bold">DELETE</span> to confirm
            </label>
            <input
              id="confirm"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3 py-2 border rounded-md"
              autoComplete="off"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={confirmText !== "DELETE" || isPending}
          >
            {isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Agent
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
