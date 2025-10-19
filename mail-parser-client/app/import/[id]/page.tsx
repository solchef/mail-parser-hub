"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Database, Play, Save } from "lucide-react"
import Link from "next/link"

import { api } from "@/lib/api"
import { toast } from "sonner"

export default function ImportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [connections, setConnections] = useState<any[]>([])
  const [selectedConnection, setSelectedConnection] = useState<string>("")
  const [creatingConnection, setCreatingConnection] = useState(false)
  const [mappingId, setMappingId] = useState<string>("")


  const [dbType, setDbType] = useState("mysql")
  const [dbConfig, setDbConfig] = useState({
    host: "",
    port: "",
    user: "",
    password: "",
    database: "",
    type: dbType,
  })

  const [tables, setTables] = useState<string[]>([])
  const [selectedTable, setSelectedTable] = useState("")
  const [tableColumns, setTableColumns] = useState<any[]>([])
  const [truncateTable, setTruncateTable] = useState(false)
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({})
  const [isProcessing, setIsProcessing] = useState(false)

  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvPreview, setCsvPreview] = useState<string[][]>([])

  const [mappingName, setMappingName] = useState("")

  // Load existing connections
  const loadConnections = async () => {
    try {
      const data = await api.settings.getDatabaseConnections()
      setConnections(data)
    } catch (err: any) {
      console.error("Failed to load connections:", err.message)
    }
  }

  useEffect(() => {
    loadConnections()

    const loadCsvPreview = async () => {
      try {
        const preview = await api.files.preview(id)
        setCsvHeaders(preview.headers || [])
        setCsvPreview((preview.rows || []).slice(0, 3));
      } catch (err: any) {
        console.error("Failed to load CSV preview:", err.message)
      }
    }

    loadCsvPreview()
  }, [id])

  const handleSelectConnection = async (connId: string) => {
    setSelectedConnection(connId)
    setCreatingConnection(false)

    try {
      const tablesRes = await api.database.getTables(connId)
      setTables(tablesRes?.tables || [])
      setStep(2)
    } catch (err: any) {
      toast("Failed to fetch tables: " + err.message)
    }
  }

  const handleTestConnection = async () => {
    try {
      const config = { ...dbConfig, type: dbType }
      const savedConnection = await api.settings.saveDatabaseConnection(config)
      setSelectedConnection(savedConnection.id)

      await loadConnections()

      const tablesRes = await api.database.getTables(savedConnection.id)
      setTables(tablesRes?.tables || [])
      setStep(2)
    } catch (err: any) {
      toast("Connection failed: " + err.message)
    }
  }

  const handleTableSelect = async (table: string) => {
    setSelectedTable(table)

    try {
      const columnsRes = await api.database.getColumns(selectedConnection, table)
      // console.log
      setTableColumns(columnsRes?.columns || [])

      const initialMappings: Record<string, string> = {}
      csvHeaders.forEach((header) => (initialMappings[header] = ""))
      setColumnMappings(initialMappings)

      setStep(3)
    } catch (err: any) {
      toast("Failed to fetch columns: " + err.message)
    }
  }

  // const handleSaveMapping = async () => {
  //   if (!mappingName) {
  //     toast("Please provide a mapping name.")
  //     return
  //   }

  //   try {
  //     const saved = await api.mappings.create({
  //       name: mappingName,
  //       fileId: id,
  //       connectionId: selectedConnection,
  //       table: selectedTable,
  //       mapping: columnMappings,
  //       options: { truncate: truncateTable },
  //     })
  //     setMappingId(saved.id)
  //     toast("Mapping saved!")
  //   } catch (err: any) {
  //     toast("Failed to save mapping: " + err.message)
  //   }
  // }

  const handleSaveMapping = async () => {
    if (!mappingName) {
      toast("Please provide a mapping name.")
      return
    }

    try {
      // ✅ If this is a new table with schema objects
      if (tableColumns.length && typeof tableColumns[0] === "object") {
        const schema = tableColumns.map((c: any) => ({
          name: c.name,
          inferredType: c.inferredType,
        }));

        await api.database.createTableFromSchema({
          connectionId: selectedConnection,
          tableName: selectedTable,
          schema,
        });

        toast(`Table "${selectedTable}" created successfully.`);
      }

      // ✅ Proceed with normal mapping save
      const saved = await api.mappings.create({
        name: mappingName,
        fileId: id,
        connectionId: selectedConnection,
        table: selectedTable,
        mapping: columnMappings,
        options: { truncate: truncateTable },
      });
      setMappingId(saved.id);
      toast("Mapping saved!");
      setStep(4)
    } catch (err: any) {
      toast("Failed to save mapping: " + err.message);
    }
  };


  const handleProcessImport = async () => {
    setIsProcessing(true)
    try {
      await api.import.process(id, mappingId, { truncate: truncateTable })
      toast("Import completed successfully!")
      router.push("/files")
    } catch (err: any) {
      toast("Import failed: " + err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleMappingChange = (csvColumn: string, dbColumn: string) => {
    setColumnMappings((prev) => ({ ...prev, [csvColumn]: dbColumn }))
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/files">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Files
          </Link>
        </Button>
      </div>

      <h1 className="text-3xl font-bold">Import Processing</h1>
      {/* <p className="text-muted-foreground mt-1">Configure and process your CSV import</p> */}

      {/* Steps */}
      <div className="flex items-center gap-4">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= n
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
                }`}
            >
              {n}
            </div>
            <span className="text-sm font-medium">
              {n === 1
                ? "Database Connection"
                : n === 2
                  ? "Select Table"
                  : n === 3
                    ? "Map Columns"
                    : "Review & Process"}
            </span>
            {n < 4 && <div className="h-px flex-1 bg-border" />}
          </div>
        ))}

      </div>

      {step >= 2 && (
        <div className="absolute top-20 right-14 w-150">
          <Card className="text-xs">
            {/* <CardHeader>
              <CardTitle className="text-sm">CSV Preview</CardTitle>
            </CardHeader> */}
            <CardContent className="overflow-auto max-h-64">
              <table className="w-full border text-left">
                <thead>
                  <tr>
                    {csvHeaders.map(h => (
                      <th key={h} className="px-2 py-1 border-b">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvPreview.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j} className="px-2 py-1 border-b truncate">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}


      {/* Step 1 */}
      {step === 1 && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Database Connection</CardTitle>
            <CardDescription>Select an existing connection or create a new one</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Select onValueChange={(value) => value === "new" ? router.push("/connections") : handleSelectConnection(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a connection" />
              </SelectTrigger>
              <SelectContent>
                {connections.map(conn => (
                  <SelectItem key={conn.id} value={conn.id}>{conn.name} - {conn.database} ({conn.type})</SelectItem>
                ))}
                <SelectItem value="new">+ Create new connection</SelectItem>
              </SelectContent>
            </Select>

            {creatingConnection && (
              <>
                <div className="space-y-2">
                  <Label>Database Type</Label>
                  <Select value={dbType} onValueChange={setDbType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select database type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mysql">MySQL</SelectItem>
                      <SelectItem value="mssql">MS SQL Server</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input placeholder="Host" value={dbConfig.host} onChange={(e) => setDbConfig({ ...dbConfig, host: e.target.value })} />
                <Input placeholder="Port" value={dbConfig.port} onChange={(e) => setDbConfig({ ...dbConfig, port: e.target.value })} />
                <Input placeholder="Database Name" value={dbConfig.database} onChange={(e) => setDbConfig({ ...dbConfig, database: e.target.value })} />
                <Input placeholder="Username" value={dbConfig.user} onChange={(e) => setDbConfig({ ...dbConfig, user: e.target.value })} />
                <Input placeholder="Password" type="password" value={dbConfig.password} onChange={(e) => setDbConfig({ ...dbConfig, password: e.target.value })} />
                <Button onClick={handleTestConnection} className="w-full">
                  <Database className="h-4 w-4 mr-2" /> Test Connection & Continue
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <Card>
          <CardHeader><CardTitle>Select Table</CardTitle></CardHeader>
          <CardContent className="space-y-6">

            {/* ✅ Create New Table Section */}
            <div className="p-4 border rounded-lg space-y-3 bg-muted/30">
              {!creatingConnection && (
                <>
                  <Button variant="outline" onClick={() => setCreatingConnection(true)}>
                    + Create New Table
                  </Button>
                </>
              )}

              {creatingConnection && (
                <>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Enter new table name"
                      value={selectedTable}
                      onChange={(e) => setSelectedTable(e.target.value)}
                    />
                    <Button
                      onClick={async () => {
                        try {
                          const preview = csvPreview.slice(0, 5).map((r) =>
                            Object.fromEntries(csvHeaders.map((h, i) => [h, r[i]]))
                          );

                          const schemaRes = await api.database.analyzeSchema(preview);

                          const normalizedSchema = schemaRes.schema.map((col: any) => ({
                            name: col.suggestedName || col.name || col.originalName,
                            originalName: col.originalName || col.name,
                            inferredType: col.inferredType || "string",
                          }));

                          setTableColumns(normalizedSchema);


                          // 🧩 Auto-map CSV headers to matching inferred columns
                          const autoMappings: Record<string, string> = {};
                          csvHeaders.forEach((header) => {
                            const normalizedHeader = header.replace(/[\s_]/g, "").toLowerCase();
                            const match = normalizedSchema.find(
                              (col: any) => col.name.replace(/[\s_]/g, "").toLowerCase() === normalizedHeader
                            );
                            autoMappings[header] = match ? match.name : "";
                          });

                          setColumnMappings(autoMappings);
                          toast("Schema analyzed successfully! Auto-mapped matching columns.");
                          setStep(3);


                        } catch (err: any) {
                          toast("Schema analysis failed: " + err.message);
                        }
                      }}
                    >
                      Analyze CSV Schema
                    </Button>
                  </div>
                </>
              )}
            </div>


            {/* list existing tables */}
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {tables.map(table => (
                <button key={table} onClick={() => handleTableSelect(table)} className="p-4 border rounded-lg hover:bg-muted/50">
                  <div className="font-medium">{table}</div>
                  {/* <div className="text-sm text-muted-foreground">{tableColumns.length} columns</div> */}
                </button>
              ))}
            </div>

          </CardContent>
        </Card>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <>
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Column Mapping</CardTitle>
                  <CardDescription>Map CSV columns to database table columns</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg mb-4">
                <Checkbox id="truncate" checked={truncateTable} onCheckedChange={(checked) => setTruncateTable(checked as boolean)} />
                <label htmlFor="truncate">Truncate table before import</label>
              </div>
              <Input placeholder="Mapping Name" value={mappingName} onChange={(e) => setMappingName(e.target.value)} className="mb-4" />
              {/* {csvHeaders.map(csvColumn => (
                <div key={csvColumn} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <Label>{csvColumn}</Label>
                    <Badge variant="secondary">{csvColumn}</Badge>
                  </div>
                  <div className="text-muted-foreground">→</div>
                  <div className="flex-1">
                    <Select value={columnMappings[csvColumn]} onValueChange={(value) => handleMappingChange(csvColumn, value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="skip">Skip this column</SelectItem>
                        {tableColumns.map(col => (
                          <SelectItem key={col} value={col}>{col}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))} */}

              {csvHeaders.map(csvColumn => {
                const existing = Array.isArray(tableColumns) && typeof tableColumns[0] === "object";
                const colOptions = existing ? tableColumns.map((c: any) => c.name) : tableColumns;

                return (
                  <div key={csvColumn} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex-1">
                      <Label>{csvColumn}</Label>
                      <Badge variant="secondary">{csvColumn}</Badge>
                    </div>
                    <div className="text-muted-foreground">→</div>
                    <div className="flex-1">
                      <Select
                        value={columnMappings[csvColumn]}
                        onValueChange={(value) => handleMappingChange(csvColumn, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="skip">Skip this column</SelectItem>
                          {colOptions.map((col: any) => (
                            <SelectItem key={col} value={col}>{col}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {/* {columnMappings[csvColumn] && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Auto-matched
                        </Badge>
                      )} */}
                    </div>

                    {/* 🧩 If this is a new table, show editable type selector */}
                    {existing && (
                      <div className="flex-1">
                        <Select
                          value={tableColumns.find((c: any) => c.originalName === csvColumn)?.inferredType || "string"}
                          onValueChange={(newType) => {
                            setTableColumns((prev: any) =>
                              prev.map((col: any) =>
                                col.originalName === csvColumn ? { ...col, inferredType: newType } : col
                              )
                            );
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            {["string", "integer", "boolean", "date", "text"].map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                );
              })}

            </CardContent>
            <CardContent>
              <Button onClick={handleSaveMapping} variant="outline">
                <Save className="h-4 w-4 mr-2" /> Save Mapping
              </Button>
            </CardContent>
          </Card>



          {/* <div className="flex justify-end">
            <Button onClick={handleProcessImport} disabled={isProcessing} size="lg">
              <Play className="h-4 w-4 mr-2" />
              {isProcessing ? "Processing..." : "Process Import"}
            </Button>
          </div> */}
        </>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Review & Process Import</CardTitle>
            <CardDescription>Confirm all settings before import</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Database Connection</Label>
                <p className="font-medium text-muted-foreground">
                  {connections.find(c => c.id === selectedConnection)?.name}
                </p>
              </div>
              <div>
                <Label>Table</Label>
                <p className="font-medium text-muted-foreground">{selectedTable}</p>
              </div>
              <div>
                <Label>Mapping Name</Label>
                <p className="font-medium text-muted-foreground">{mappingName}</p>
              </div>
              <div>
                <Label>Truncate Table Before Import</Label>
                <Badge variant={truncateTable ? "destructive" : "secondary"}>
                  {truncateTable ? "Yes" : "No"}
                </Badge>
              </div>
            </div>

            <div className="border-t pt-4">
              <Label>Column Mappings</Label>
              <div className="max-h-48 overflow-auto mt-2 text-sm">
                <table className="w-full border">
                  <thead>
                    <tr className="bg-muted">
                      <th className="px-2 py-1 border">CSV Column</th>
                      <th className="px-2 py-1 border">DB Column</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(columnMappings).map(([csv, db]) => (
                      <tr key={csv}>
                        <td className="px-2 py-1 border">{csv}</td>
                        <td className="px-2 py-1 border">{db || <em className="text-muted-foreground">Skipped</em>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
          <CardContent className="flex justify-end pt-6">
            <Button
              size="lg"
              disabled={isProcessing}
              onClick={handleProcessImport}
              className="w-60"
            >
              <Play className="h-4 w-4 mr-2" />
              {isProcessing ? "Processing..." : "Process Import"}
            </Button>
          </CardContent>
        </Card>
      )}

    </div>
  )
}