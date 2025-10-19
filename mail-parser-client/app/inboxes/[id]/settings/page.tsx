"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { api } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, CheckCircle2, Loader2, RefreshCw } from "lucide-react"

export default function InboxSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [inbox, setInbox] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const [name, setName] = useState("")
  const [gmailConfig, setGmailConfig] = useState({
    clientId: "",
    clientSecret: "",
    refreshToken: "",
    redirectUri: "",
  })
  const [imapConfig, setImapConfig] = useState({
    host: "",
    port: 993,
    tls: true,
    user: "",
    password: "",
  })

  useEffect(() => {
    const loadInbox = async () => {
      try {
        const data = await api.inboxes.getById(id)
        setInbox(data)
        setName(data.name || "")

        if (data.gmailConfig) {
          const g = typeof data.gmailConfig === "string" ? JSON.parse(data.gmailConfig) : data.gmailConfig
          setGmailConfig({
            clientId: g.clientId || "",
            clientSecret: g.clientSecret || "",
            refreshToken: g.refreshToken || "",
            redirectUri: g.redirectUri || "",
          })
        }

        if (data.imapConfig) {
          const imap = typeof data.imapConfig === "string" ? JSON.parse(data.imapConfig) : data.imapConfig
          setImapConfig({
            host: imap.host || "",
            port: imap.port || 993,
            tls: imap.tls ?? true,
            user: imap.user || "",
            password: imap.password || "",
          })
        }
      } catch (err) {
        console.error("Failed to load inbox:", err)
      }
    }

    loadInbox()
  }, [id])

  const handleTestConnection = async () => {
    setIsTesting(true)
    setTestResult(null)

    try {
      if (inbox.type === "gmail") {
        await api.inboxes.testGmailConnection(id, gmailConfig)
      } else {
        await api.inboxes.testGmailConnection(id, imapConfig)
      }

      setTestResult({
        success: true,
        message: `${inbox.type.toUpperCase()} connection successful!`,
      })
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error?.message || `Failed to connect to ${inbox.type.toUpperCase()}.`,
      })
    } finally {
      setIsTesting(false)
    }
  }

  const handleSaveConfiguration = async () => {
    setIsSaving(true)
    try {
      const payload: any = {
        name,
        email: inbox.email,
        type: inbox.type,
        uploadsBase: inbox.uploadsBase,
        gmailConfig: null,
        imapConfig: null,
      }

      if (inbox.type === "imap") {
        payload.imapConfig = {
          host: imapConfig.host,
          port: Number(imapConfig.port),
          tls: !!imapConfig.tls,
          user: imapConfig.user,
          password: imapConfig.password,
        }
      } else {
        payload.gmailConfig = gmailConfig
      }

      const updated = await api.inboxes.update(id, payload)
      setInbox(updated)

      setTestResult({
        success: true,
        message: "Configuration saved successfully!",
      })
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error?.message || "Failed to save configuration.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (!inbox) return <p className="p-8 text-center">Loading inbox...</p>

  const renderConfigForm = () => {
    if (inbox.type === "gmail") {
      return (
        <>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input readOnly value={inbox.email} className="font-mono text-sm bg-secondary" />
          </div>
          {/* <Button
            variant="default"
            onClick={() =>
              (window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google?inboxId=${id}`)
            }
          >
            Connect Gmail Account
          </Button> */}
        </>
      )
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Host</Label>
            <Input
              value={imapConfig.host}
              onChange={(e) => setImapConfig({ ...imapConfig, host: e.target.value })}
              placeholder="mail.example.com"
            />
          </div>
          <div>
            <Label>Port</Label>
            <Input
              type="number"
              value={imapConfig.port}
              onChange={(e) => setImapConfig({ ...imapConfig, port: Number(e.target.value) })}
              placeholder="993"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Username</Label>
            <Input
              value={imapConfig.user}
              onChange={(e) => setImapConfig({ ...imapConfig, user: e.target.value })}
              placeholder="user@example.com"
            />
          </div>
          <div>
            <Label>Password</Label>
            <Input
              type="password"
              value={imapConfig.password}
              onChange={(e) => setImapConfig({ ...imapConfig, password: e.target.value })}
              placeholder="••••••••"
            />
          </div>
        </div>

        <div>
          <Label>
            <input
              type="checkbox"
              checked={imapConfig.tls}
              onChange={(e) => setImapConfig({ ...imapConfig, tls: e.target.checked })}
              className="mr-2"
            />
            Use TLS
          </Label>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/inboxes`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Inbox Settings</h1>
            <p className="text-muted-foreground">{inbox.email}</p>
          </div>
        </div>

        <Badge
          variant="outline"
          className={
            inbox.gmailConfigured
              ? "bg-green-500/10 text-green-500 border-green-500/20"
              : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
          }
        >
          {/* {inbox.gmailConfigured ? "Configured" : "Not Configured"} */}
        </Badge>
      </div>

      <Tabs defaultValue="mailConfig">
        <TabsList>
          <TabsTrigger value="mailConfig">Mail Configuration</TabsTrigger>
          <TabsTrigger value="general">General Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="mailConfig" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{inbox.type.toUpperCase()} Configuration</CardTitle>
              <CardDescription>Update or test connection settings for this inbox.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Inbox name" />
              </div>

              {renderConfigForm()}

              {testResult && (
                <Alert
                  className={
                    testResult.success
                      ? "border-green-500/50 bg-green-500/10"
                      : "border-red-500/50 bg-red-500/10"
                  }
                >
                  <AlertDescription className={testResult.success ? "text-green-500" : "text-red-500"}>
                    {testResult.message}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3 pt-4">
                {/* <Button onClick={handleTestConnection} disabled={isTesting} variant="outline" className="gap-2">
                  {isTesting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Test Connection
                    </>
                  )}
                </Button> */}

                <Button onClick={handleSaveConfiguration} disabled={isSaving} className="gap-2">
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Update Configuration
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Inbox Info</CardTitle>
              <CardDescription>Basic details</CardDescription>
            </CardHeader>
            <CardContent>
              <p><strong>Name:</strong> {inbox.name}</p>
              <p><strong>Email:</strong> {inbox.email}</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
