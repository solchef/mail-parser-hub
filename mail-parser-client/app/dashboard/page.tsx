"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, CheckCircle2, XCircle, Clock, RefreshCcw } from "lucide-react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function DashboardPage() {
  const [stats, setStats] = useState<any[]>([])
  const [recentFiles, setRecentFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const lastImportsCount = useRef<number>(0)

  const fetchData = async () => {
    setLoading(true)
    try {
      const files = await api.files.getAll()
      const imports = await api.import.getAllHistory()

      // Compare import count for toast
      if (imports.length > lastImportsCount.current) {
        toast(`You have ${imports.length - lastImportsCount.current} new import(s).`)
      }
      lastImportsCount.current = imports.length

      const processedFiles = files.filter(f => f.status === "processed")
      const failedFiles = files.filter(f => f.status === "bad")
      const newFiles = files.filter(f => f.status === "pending")

      const enrichedFiles = files.map(file => {
        const imp = imports.find(im => im.fileId === file.id)
        return {
          ...file,
          recordsImported: imp?.recordsImported ?? file.recordsImported ?? 0,
          importStatus: imp?.status || file.status || "unknown",
          importedAt: imp?.importedAt || file.createdAt || null,
        }
      })

      setStats([
        {
          title: "New Files",
          value: newFiles.length.toString(),
          icon: FileText,
          description: "Waiting to be processed",
          color: "text-blue-500",
        },
        {
          title: "Processed Files",
          value: processedFiles.length.toString(),
          icon: CheckCircle2,
          description: "Successfully imported",
          color: "text-green-500",
        },
        {
          title: "Failed Files",
          value: failedFiles.length.toString(),
          icon: XCircle,
          description: "Require attention",
          color: "text-red-500",
        },
        {
          title: "Total Imports",
          value: imports.length.toString(),
          icon: Clock,
          description: "All time",
          color: "text-purple-500",
        },
      ])

      setRecentFiles(
        enrichedFiles
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)
          .map(file => ({
            name: file.filename,
            status: file.status,
            time: new Date(file.createdAt).toLocaleString(),
            records: file.recordsImported,
          }))
      )
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()

    const interval = setInterval(fetchData, 30000) // refresh every 30s

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-balance">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of all your inboxes and import activity</p>
        </div>
        <Button
          onClick={fetchData}
          className="flex items-center gap-2"
          disabled={loading}
        >
          <RefreshCcw className="h-4 w-4" />
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map(stat => (
          <Card key={stat.title} className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Files */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Recent Files</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div className="flex items-center gap-4">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">{file.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">{file.records} records</span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${file.status === "processed"
                      ? "bg-green-500/10 text-green-500"
                      : file.status === "new"
                        ? "bg-blue-500/10 text-blue-500"
                        : "bg-red-500/10 text-red-500"
                      }`}
                  >
                    {file.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
