"use client"

import { use, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Mail,
  Copy,
  Settings,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
} from "lucide-react"
import Link from "next/link"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"
import { api } from "@/lib/api"
import React from "react"

export default function InboxDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // unwrap the promise
  const { id } = use(params)

  const [inbox, setInbox] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [chartData, setChartData] = useState<any[]>([])
  const [recentFiles, setRecentFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  useEffect(() => {
    const fetchInboxDetails = async () => {
      setLoading(true)
      try {
        const inboxData = await api.inboxes.getById(id)
        setInbox(inboxData)

        const analytics = await api.inboxes.getAnalytics(id)
        setStats({
          emailsLast30Days: inboxData.emailsLast30Days || 0,
          processedFiles: inboxData.processedFiles || 0,
          failedFiles: inboxData.failedFiles || 0,
          pendingFiles: inboxData.pendingFiles || 0,
          totalRecordsImported: inboxData.totalRecordsImported || 0,
        })

        setChartData(analytics.chartData || [])
        setRecentFiles(analytics.recentFiles || [])
      } catch (error) {
        console.error("Error fetching inbox details:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchInboxDetails()
  }, [id])

  if (loading || !inbox || !stats) {
    return <div className="p-8">Loading inbox details...</div>
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/inboxes">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-balance">{inbox.name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span className="font-mono">{inbox.email}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => copyToClipboard(inbox.email)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <Badge
                variant="outline"
                className={
                  inbox.status === "active"
                    ? "bg-green-500/10 text-green-500 border-green-500/20"
                    : "bg-gray-500/10 text-gray-500 border-gray-500/20"
                }
              >
                {inbox.status}
              </Badge>
            </div>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/inboxes/${id}/settings`}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Emails (30 days)</CardTitle>
            <Mail className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.emailsLast30Days}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Processed Files</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.processedFiles}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalRecordsImported.toLocaleString()} records imported
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Files</CardTitle>
            <Clock className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.failedFiles}</div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Failed Files</CardTitle>
            <XCircle className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.failedFiles}</div>
            <p className="text-xs text-muted-foreground mt-1">Require attention</p>
          </CardContent>
        </Card>


      </div>

      {/* Chart */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Email Activity (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Line type="monotone" dataKey="emails" stroke="hsl(var(--primary))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Files */}
      {/* <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Files</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/files?inbox=${id}`}>View All</Link>
          </Button>
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
                  <Badge
                    variant="outline"
                    className={
                      file.status === "processed"
                        ? "bg-green-500/10 text-green-500 border-green-500/20"
                        : "bg-red-500/10 text-red-500 border-red-500/20"
                    }
                  >
                    {file.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card> */}
    </div>
  )
}
