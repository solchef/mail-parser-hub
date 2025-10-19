"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Eye, AlertCircle, CheckCircle2, Clock, Filter } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { api } from "@/lib/api"

export default function HistoryPage() {
  const [history, setHistory] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedLog, setSelectedLog] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await api.import.getAllHistory()
        setHistory(data || [])
      } catch (err: any) {
        console.error("Failed to load import history:", err.message)
      } finally {
        setIsLoading(false)
      }
    }
    loadHistory()
  }, [])

  const filteredHistory = history.filter((log) => {
    const matchesSearch = log.filename.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || log.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleViewDetails = (log: any) => {
    setSelectedLog(log)
    setIsDialogOpen(true)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "partial":
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "failed":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "partial":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Import History</h1>
        <p className="text-muted-foreground mt-1">View logs and details of all import operations</p>
      </div>

      {/* Filters */}
      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by filename..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-secondary border-border"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px] bg-secondary border-border">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* History Table */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>
            {isLoading ? "Loading..." : `Import Logs (${filteredHistory.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="p-6 text-center text-muted-foreground">Loading import history...</div>
          ) : filteredHistory.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">No imports found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Filename</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Records</th>
                    {/* <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Table</th> */}
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Timestamp</th>
                    {/* <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Duration</th> */}
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((log) => (
                    <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="py-4 px-4 font-medium">{log.filename}</td>
                      <td className="py-4 px-4">
                        <Badge variant="outline" className={getStatusColor(log.status)}>
                          <span className="flex items-center gap-1.5">
                            {getStatusIcon(log.status)}
                            {log.status}
                          </span>
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-sm font-medium">{log.recordsImported?.toLocaleString?.() || 0}</td>
                      {/* <td className="py-4 px-4 text-sm text-muted-foreground">{log.table || "-"}</td> */}
                      <td className="py-4 px-4 text-sm text-muted-foreground">{log.importedAt}</td>
                      {/* <td className="py-4 px-4 text-sm text-muted-foreground">{log.duration || "-"}</td> */}
                      <td className="py-4 px-4 text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetails(log)}>
                          <Eye className="h-4 w-4 mr-1" /> Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Details</DialogTitle>
            <DialogDescription>{selectedLog?.filename}</DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InfoCard label="Status">
                  <Badge variant="outline" className={getStatusColor(selectedLog.status)}>
                    {getStatusIcon(selectedLog.status)}
                    {selectedLog.status}
                  </Badge>
                </InfoCard>
                <InfoCard label="Records Imported">
                  {selectedLog.recordsImported?.toLocaleString() || 0}
                </InfoCard>
                {/* <InfoCard label="Target Table">{selectedLog.table}</InfoCard>
                <InfoCard label="Database Type">{selectedLog.dbType}</InfoCard>
                <InfoCard label="Timestamp">{selectedLog.timestamp}</InfoCard>
                <InfoCard label="Duration">{selectedLog.duration}</InfoCard> */}
              </div>

              {/* {selectedLog.errors?.length > 0 ? (
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    Errors ({selectedLog.errors?.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedLog?.errors?.map((err: string, idx: number) => (
                      <div key={idx} className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm">
                        {err}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Import completed successfully</span>
                </div>
              )} */}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function InfoCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="p-4 bg-muted/50 rounded-lg">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="font-medium mt-1">{children}</div>
    </div>
  )
}
