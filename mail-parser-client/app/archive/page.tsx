"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Download, Eye } from "lucide-react"
import { api } from "@/lib/api" // ✅ match your existing API structure

export default function ArchivePage() {
  const [files, setFiles] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedInbox, setSelectedInbox] = useState("all")
  const [loading, setLoading] = useState(true)

  // ✅ Load archived files from backend
  useEffect(() => {
    async function loadFiles() {
      try {
        const data = await api.archive.getArchivedFiles()
        setFiles(data || [])
      } catch (error: any) {
        console.error("Failed to load archived files:", error.message)
      } finally {
        setLoading(false)
      }
    }
    loadFiles()
  }, [])

  // 🔍 Filter logic
  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.filename.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesInbox = selectedInbox === "all" || file.inboxName === selectedInbox
    return matchesSearch && matchesInbox
  })

  // ⬇️ Download file
  const handleDownload = async (id: string) => {
    try {
      await api.archive.downloadFile(id)
    } catch (error: any) {
      alert(`Error downloading file: ${error.message}`)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Archive</h1>
        <p className="text-muted-foreground mt-2">View and manage archived CSV files</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Archived Files</CardTitle>
          <CardDescription>All processed files are automatically archived for future reference</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedInbox} onValueChange={setSelectedInbox}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by inbox" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Inboxes</SelectItem>
                {/* Dynamically fill unique inbox names */}
                {[...new Set(files.map((f) => f.inboxName))].map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            {loading ? (
              <div className="p-6 text-center text-muted-foreground">Loading archived files...</div>
            ) : filteredFiles.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">No archived files found.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Filename</TableHead>
                    <TableHead>Inbox</TableHead>
                    <TableHead>Received</TableHead>
                    <TableHead>Archived</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFiles.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell className="font-medium">{file.filename}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{file.inboxName}</div>
                          <div className="text-xs text-muted-foreground">{file.inboxEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(file.receivedAt).toLocaleString()}</TableCell>
                      <TableCell>{new Date(file.archivedAt).toLocaleString()}</TableCell>
                      <TableCell>{file.size}</TableCell>
                      <TableCell>{file.records?.toLocaleString?.() ?? "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDownload(file.id)}>
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
