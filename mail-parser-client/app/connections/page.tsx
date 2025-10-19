"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Database, Plus, Pencil, Trash2, TestTube } from "lucide-react"
import { api } from "@/lib/api" // adjust import path

export default function DBConnectionsPage() {
  const [connections, setConnections] = useState<any[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedConnection, setSelectedConnection] = useState<any>(null)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: "",
    type: "mysql",
    host: "",
    port: "",
    database: "",
    user: "",
    password: "",
  })

  // 🔹 Load database connections
  useEffect(() => {
    async function loadConnections() {
      try {
        const data = await api.settings.getDatabaseConnections()
        setConnections(data || [])
      } catch (error: any) {
        console.error("Failed to load database connections:", error.message)
      } finally {
        setLoading(false)
      }
    }
    loadConnections()
  }, [])

  // 🔹 Handle connection form changes
  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // 🔹 Save new connection
  const handleSaveConnection = async () => {
    try {
      const saved = await api.settings.saveDatabaseConnection(formData)
      setConnections((prev) => [...prev, saved])
      setIsAddDialogOpen(false)
      setFormData({
        name: "",
        type: "mysql",
        host: "",
        port: "",
        database: "",
        user: "",
        password: "",
      })
    } catch (error: any) {
      alert(`Error saving connection: ${error.message}`)
    }
  }

  // 🔹 Test connection
  const handleTestConnection = async (connectionId: string) => {
    const conn = connections.find((c) => c.id === connectionId)
    if (!conn) return

    setTestingId(connectionId)
    try {
      const result = await api.database.testConnection(conn)
      alert(result.success ? "✅ Connection successful!" : "❌ Connection failed")
    } catch (error: any) {
      alert(`Error testing connection: ${error.message}`)
    } finally {
      setTestingId(null)
    }
  }

  const handleDeleteConnection = async (connectionId: string) => {
    if (!confirm("Are you sure you want to delete this connection?")) return;

    try {
      await api.settings.deleteConnection(connectionId);
      setConnections((prev) => prev.filter((c) => c.id !== connectionId));
      alert("Connection deleted successfully");
    } catch (error: any) {
      alert(`Error deleting connection: ${error.message}`);
    }
  }


  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Database Connections</h1>
          <p className="text-muted-foreground mt-2">Manage database connections for data imports</p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Connection
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Database Connection</DialogTitle>
              <DialogDescription>Configure a new database connection for importing data</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Connection Name</Label>
                <Input value={formData.name} onChange={(e) => handleChange("name", e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Database Type</Label>
                <Select value={formData.type} onValueChange={(v) => handleChange("type", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select DB Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mysql">MySQL</SelectItem>
                    <SelectItem value="mssql">MS SQL Server</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Host</Label>
                  <Input value={formData.host} onChange={(e) => handleChange("host", e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Port</Label>
                  <Input value={formData.port} onChange={(e) => handleChange("port", e.target.value)} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Database Name</Label>
                <Input value={formData.database} onChange={(e) => handleChange("database", e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Username</Label>
                <Input value={formData.user} onChange={(e) => handleChange("user", e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveConnection}>Save Connection</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <p>Loading connections...</p>
        ) : connections.length === 0 ? (
          <p className="text-muted-foreground">No connections found.</p>
        ) : (
          connections.map((connection) => (
            <Card key={connection.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Database className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>{connection.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {connection.host}:{connection.port} / {connection.database}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={connection.status === "active" ? "secondary" : "secondary"}>
                    {connection.status || "active"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="grid grid-cols-3 gap-6 text-sm">
                    <div>
                      <div className="text-muted-foreground">Type</div>
                      <div className="font-medium mt-1">{connection.type?.toUpperCase()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Username</div>
                      <div className="font-medium mt-1">{connection.user}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Created</div>
                      <div className="font-medium mt-1">
                        {connection.createdAt
                          ? new Date(connection.createdAt).toLocaleDateString()
                          : "Never"}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestConnection(connection.id)}
                      disabled={testingId === connection.id}

                    >
                      <TestTube className="h-4 w-4 mr-2" />
                      {testingId === connection.id ? "Testing..." : "Test"}

                    </Button>
                    {/* <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedConnection(connection)
                        setIsEditDialogOpen(true)
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button> */}
                    <Button variant="outline" size="sm" onClick={() => handleDeleteConnection(connection.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
