"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Search,
  Settings,
  Copy,
  Trash2,
  BarChart3,
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { api } from "@/lib/api"
import { toast } from "sonner"
import InboxCreateModal from "@/components/inbox-create-modal"

// Inbox type
type Inbox = {
  id: string
  name: string
  email: string
  status: string
  emailsLast30Days: number
  pendingFiles: number
  failedWebhooks: number
  processedFiles: number
  failedFiles: number
  lastReceived: string
}

export default function InboxesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; inbox?: Inbox }>({ open: false })

  const [inboxes, setInboxes] = useState<Inbox[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch inboxes + analytics from backend
  const fetchInboxes = async () => {
    setLoading(true)
    try {
      const data = await api.inboxes.getAll()
      const normalized = (data as Partial<Inbox>[]).map((inbox) => ({
        ...inbox,
        emailsLast30Days: inbox.emailsLast30Days ?? 0,
        pendingFiles: inbox.pendingFiles ?? 0,
        failedWebhooks: inbox.failedWebhooks ?? 0,
        processedFiles: inbox.processedFiles ?? 0,
        failedFiles: inbox.failedFiles ?? 0,
        lastReceived: inbox.lastReceived ?? "N/A",
      })) as Inbox[]
      setInboxes(normalized)
    } catch (error) {
      console.error("Error fetching inboxes:", error)
      setInboxes([])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchInboxes()
  }, [])

  const filteredInboxes = inboxes.filter((inbox) => {
    const matchesSearch =
      inbox.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inbox.email?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === "all" || inbox.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const handleCreateInbox = async () => {
    try {

      // await api.inboxes.create(payload)
      setIsCreateDialogOpen(false)
      fetchInboxes()
    } catch (error) {
      console.error("Error creating inbox:", error)
    }
  }

  const handleDeleteInbox = async () => {
    if (!deleteDialog.inbox) return
    try {
      await api.inboxes.delete(deleteDialog.inbox.id)
      toast(`${deleteDialog.inbox.name} removed successfully.`)
      setDeleteDialog({ open: false })
      fetchInboxes()
    } catch (error) {
      // console.error("Error deleting inbox:", error)
      toast(`Error deleting inbox`)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Inboxes</h1>
          <p className="text-muted-foreground mt-1">Manage your email parsing inboxes</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create New Inbox
        </Button>

        <InboxCreateModal
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          onCreated={() => {
            handleCreateInbox()
          }}
        />

      </div>

      {/* Filters */}
      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search inboxes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-secondary border-border"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[180px] bg-secondary border-border">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Inboxes</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Inboxes Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div>Loading inboxes...</div>
        ) : filteredInboxes.length > 0 ? (
          filteredInboxes.map((inbox) => (
            <Card key={inbox.id} className="border-border hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{inbox.name}</CardTitle>
                    <Badge
                      variant="outline"
                      className={`mt-2 ${inbox.status === "active"
                        ? "bg-green-500/10 text-green-500 border-green-500/20"
                        : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                        }`}
                    >
                      {inbox.status || "inactive"}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                      <Link href={`/inboxes/${inbox.id}/settings`}>
                        <Settings className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setDeleteDialog({ open: true, inbox })}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                  <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm font-mono flex-1 truncate">{inbox.email || "N/A"}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0"
                    onClick={() => copyToClipboard(inbox.email)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>

                {/* Stats */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Emails (30 days)</span>
                    <span className="font-semibold">{inbox.emailsLast30Days}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-muted rounded-lg">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      </div>
                      <div className="text-lg font-bold">{inbox.processedFiles}</div>
                      <div className="text-xs text-muted-foreground">Processed</div>
                    </div>
                    <div className="p-2 bg-muted rounded-lg">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Clock className="h-3 w-3 text-blue-500" />
                      </div>
                      <div className="text-lg font-bold">{inbox.pendingFiles}</div>
                      <div className="text-xs text-muted-foreground">Pending</div>
                    </div>
                    <div className="p-2 bg-muted rounded-lg">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <XCircle className="h-3 w-3 text-red-500" />
                      </div>
                      <div className="text-lg font-bold">{inbox.failedFiles}</div>
                      <div className="text-xs text-muted-foreground">Failed</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
                    <span className="text-muted-foreground">Last received</span>
                    <span className="font-medium">{inbox.lastReceived}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent" asChild>
                    <Link href={`/inboxes/${inbox.id}`}>
                      <BarChart3 className="h-4 w-4 mr-1" />
                      View Details
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent" asChild>
                    <Link href={`/files?inbox=${inbox.id}`}>
                      <Mail className="h-4 w-4 mr-1" />
                      Files
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="border-border border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Mail className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No inboxes found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchQuery ? "Try adjusting your search" : "Create your first inbox to get started"}
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Inbox
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Inbox</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">{deleteDialog.inbox?.name}</span>? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteInbox}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
