"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Eye, Play, Filter, CircleArrowUp } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { api } from "@/lib/api"

export default function FilesPage() {
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Preview modal state
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewFile, setPreviewFile] = useState<any>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewData, setPreviewData] = useState<{ headers: string[]; rows: string[][]; info: any }>({
    headers: [],
    rows: [],
    info: null
  })

  const fetchFiles = async () => {
    setLoading(true)
    try {
      const data = await api.files.getAll()
      setFiles(data || [])
    } catch (err) {
      console.error("Failed to load files:", err)
      setFiles([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFiles()
  }, [])

  const handleRetry = async (id: any) => {
    const data = await api.files.retryImport(id)
    fetchFiles()
    setPreviewOpen(false)
  }

  const handlePreview = async (file: any) => {
    setPreviewFile(file)
    setPreviewOpen(true)
    setPreviewLoading(true)
    setPreviewData({ headers: [], rows: [], info: null })

    try {
      const data = await api.files.preview(file.id) // must return { headers, rows }
      setPreviewData({
        headers: data.headers || [],
        rows: data.rows || [],
        info: data.importData
      })
    } catch (e) {
      console.error("Failed to preview file:", e)
    } finally {
      setPreviewLoading(false)
    }
  }

  const filteredFiles = files.filter((file) => {
    const matchesSearch = file?.filename?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || file.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "processed":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "failed":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  if (loading) return <p className="p-8 text-center">Loading files...</p>

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Files</h1>
        <p className="text-muted-foreground mt-1">Manage and process your CSV files from all inboxes</p>
      </div>

      {/* Filters */}
      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
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
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="processed">Processed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Files Table */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Files ({filteredFiles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {filteredFiles.length === 0 ? (
              <p className="text-center text-muted-foreground">No files found.</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Filename</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Inbox</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Received</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Records</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFiles.map((file) => (
                    <tr
                      key={file.id}
                      className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-4 px-4 font-medium">{file.originalFilename}</td>
                      <td className="py-4 px-4 text-sm">
                        <div>
                          <div className="font-medium">{file.inboxName}</div>
                          <div className="text-xs text-muted-foreground">{file.mailbox}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-muted-foreground">{file.createdAt}</td>
                      <td className="py-4 px-4 text-sm text-muted-foreground">{file.recordsImported}</td>
                      <td className="py-4 px-4">
                        <Badge variant="outline" className={getStatusColor(file.status)}>
                          {file.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">

                          <Button variant="ghost" size="sm" onClick={() => handlePreview(file)}>
                            <Eye className="h-4 w-4 mr-1" />
                            Preview
                          </Button>
                          {file.status === "pending" && (
                            <Button variant="default" size="sm" asChild>
                              <Link href={`/import/${file.id}`}>
                                <Play className="h-4 w-4 mr-1" />
                                Process
                              </Link>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview Modal — replace your existing Dialog block with this */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="w-[95vw] !max-w-[1200px] h-[80vh] p-4 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">
                Preview — {previewFile?.originalFilename || "Untitled File"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Showing first 10 rows. Use horizontal scroll for wide tables.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* <button
                onClick={() => setPreviewOpen(false)}
                className="rounded-md px-3 py-1 text-sm border border-border bg-secondary hover:bg-muted transition"
              >
                Close
              </button> */}
            </div>
          </div>

          <div className="mt-4 h-[calc(100%-88px)] overflow-auto rounded-md border border-border bg-card">
            {previewLoading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Loading preview...</p>
              </div>
            ) : !previewData?.rows || previewData.rows.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No data to display.</p>
              </div>
            ) : (
              /* outer wrapper allows horizontal scroll while keeping header sticky */
              <div className="min-w-full overflow-auto">
                <table className="min-w-[800px] w-full border-collapse">
                  <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm z-20">
                    <tr className="shadow-sm">
                      {previewData.headers.map((header, idx) => (
                        <th
                          key={idx}
                          className="px-3 py-2 text-left text-sm font-medium border-b border-border whitespace-nowrap"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {previewData.rows.slice(0, 10).map((row, rowIdx) => (
                      <tr
                        key={rowIdx}
                        className="border-b border-border hover:bg-muted/50 transition-colors align-top"
                      >
                        {row.map((cell, cellIdx) => (
                          <td
                            key={cellIdx}
                            className="px-3 py-2 text-sm text-muted-foreground align-top whitespace-pre-wrap break-words font-mono"
                          >
                            {cell ?? ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-4 space-y-2">
            <div className="text-sm text-muted-foreground">
              Processing Status: {previewData?.info?.status}
            </div>

            {previewData?.info?.status === "failed" && (
              <>
                <Button variant="ghost" size="sm" onClick={() => handleRetry(previewData?.info?.id)}>
                  <CircleArrowUp className="h-4 w-4 mr-1" />
                  Retry
                </Button>

                <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-md p-3">
                  <div className="font-semibold mb-1">Failure Reason:</div>

                  {(() => {
                    let errors = previewData.info.errors
                    if (typeof errors === "string") {
                      try {
                        errors = JSON.parse(errors)
                      } catch {
                        errors = [errors]
                      }
                    }

                    if (!Array.isArray(errors)) errors = [String(errors)]

                    return (
                      <ul className="list-disc pl-5 space-y-1">
                        {errors.map((err: string, idx: number) => (
                          <li key={idx} className="break-all">{err}</li>
                        ))}
                      </ul>
                    )
                  })()}
                </div>
              </>
            )}
          </div>

          {/* optional footer (keeps layout consistent) */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Showing up to 10 rows — download the file to view full data.
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  // quick client-side CSV download of preview (non-blocking)
                  try {
                    const headers = previewData.headers || []
                    const rows = previewData.rows || []
                    const all = [headers, ...rows]
                    const csv = all.map(r => r.map(c => `"${String(c || "").replace(/"/g, '""')}"`).join(",")).join("\r\n")
                    const blob = new Blob([csv], { type: "text/csv" })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement("a")
                    a.href = url
                    a.download = `${previewFile?.originalFilename || "preview"}.csv`
                    document.body.appendChild(a)
                    a.click()
                    a.remove()
                    URL.revokeObjectURL(url)
                  } catch (e) {
                    console.error("Failed to download preview CSV", e)
                  }
                }}
                className="rounded-md px-3 py-1 text-sm border border-border bg-secondary hover:bg-muted transition"
              >
                Download preview
              </button>

              <button
                onClick={() => setPreviewOpen(false)}
                className="rounded-md px-3 py-1 text-sm bg-primary text-primary-foreground hover:opacity-95 transition"
              >
                Close
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div >
  )
}
