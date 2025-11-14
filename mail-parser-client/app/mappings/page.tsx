"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Copy, Database } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { api } from "@/lib/api"

export default function MappingsPage() {
  const [mappings, setMappings] = useState<any[]>([])
  const [selectedMapping, setSelectedMapping] = useState<any>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const fetchMappings = async () => {
    try {
      const data = await api.mappings.getAll()
      setMappings(data)
    } catch (error) {
      console.error("Failed to load mappings", error)
    }
  }

  useEffect(() => {
    fetchMappings()
  }, [])

  const handleViewMapping = (mapping: any) => {
    setSelectedMapping(mapping)
    setIsViewDialogOpen(true)
  }

  const handleDeleteMapping = async () => {
    if (!selectedMapping) return
    await api.mappings.delete(selectedMapping.id)
    setMappings(mappings.filter(m => m.id !== selectedMapping.id))
    setIsDeleteDialogOpen(false)
  }

  const handleDuplicateMapping = async (mapping: any) => {
    const duplicate = { ...mapping, id: undefined, createdAt: new Date().toISOString().slice(0, 19).replace('T', ' ') }
    const newMapping = await api.mappings.create(duplicate)
    setMappings(prev => [...prev, newMapping])
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Saved Mappings</h1>
      <p className="text-muted-foreground">Manage your column mapping configurations</p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mappings.map(mapping => (
          <Card key={mapping.id} className="border-border hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Database className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{mapping.table}</CardTitle>
                </div>
              </div>
              <CardDescription className="mt-2">
                <Badge variant="secondary">{mapping.connectionId}</Badge>
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => handleViewMapping(mapping)}>
                  <Edit className="h-3 w-3 mr-1" /> View
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDuplicateMapping(mapping)}>
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedMapping(mapping)
                    setIsDeleteDialogOpen(true)
                  }}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>

              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View Mapping Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedMapping?.table}</DialogTitle>
            <DialogDescription>Mapping configuration</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedMapping &&
              Object.entries(selectedMapping.mapping).map(([csvCol, dbCol]) => (
                <div key={csvCol} className="flex items-center gap-4 p-3 border border-border rounded-lg">
                  <Badge variant="secondary" className="flex-1">{csvCol}</Badge>
                  <span className="text-muted-foreground">→</span>
                  <Badge variant="outline" className="flex-1">{String(dbCol)}</Badge>
                </div>
              ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Mapping</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedMapping?.table}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteMapping}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
