import { toast } from "sonner"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"

async function apiCall<T>(
  endpoint: string,
  options?: RequestInit,
  requiresAuth: boolean = true
): Promise<T> {
  const token = localStorage.getItem("auth_token")

  if (requiresAuth && !token) {
    redirectToLogin("Unauthorized: Please log in.")
    toast.error("Unauthorized: Please log in.")
    throw new Error("Unauthorized: No authentication token found.")
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(requiresAuth && token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    })

    if (!response.ok) {
      let error: any = {}
      try {
        error = await response.json()
      } catch {
        error.message = "An unknown error occurred"
      }

      const message =
        error.message ||
        `Request to ${endpoint} failed (${response.status})`

      // Handle unauthorized separately
      if (response.status === 401) {
        localStorage.removeItem("auth_token")
        redirectToLogin("Session expired. Please log in again.")
        toast.warning("Session expired. Please log in again.")
      } else {
        toast.error(message)
      }

      throw new Error(message)
    }

    return response.json()
  } catch (err: any) {
    toast.error(err.message || "Network error")
    throw err
  }
}


// 🔁 Helper for login redirects
function redirectToLogin(message?: string) {
  console.warn(message || "Redirecting to login...")
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_token")
    setTimeout(() => {
      window.location.href = "/login"
    }, 500)
  }
}

// 🧠 Authentication API
export const authAPI = {
  login: (email: string, password: string) =>
    apiCall<{ token: string; user: any }>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      },
      false
    ),

  signup: (email: string, password: string, name: string) =>
    apiCall<{ token: string; user: any }>(
      "/auth/signup",
      {
        method: "POST",
        body: JSON.stringify({ email, password, name }),
      },
      false
    ),

  logout: () => apiCall("/auth/logout", { method: "POST" }),
}

// 📬 Inboxes API
export const inboxesAPI = {
  getAll: () => apiCall<any[]>("/inboxes"),
  getById: (id: string) => apiCall<any>(`/inboxes/${id}`),
  create: (payload: any) =>
    apiCall<any>("/inboxes", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id: string, data: any) =>
    apiCall<any>(`/inboxes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) => apiCall(`/inboxes/${id}`, { method: "DELETE" }),
  getAnalytics: (id: string) => apiCall<any>(`/inboxes/${id}/analytics`),
  updateGmailConfig: (id: string, config: any) =>
    apiCall<any>(`/inboxes/${id}/gmail-config`, {
      method: "PUT",
      body: JSON.stringify(config),
    }),
  testGmailConnection: (id: string, config: any) =>
    apiCall<{ success: boolean; message: string }>(
      `/inboxes/${id}/gmail-config/test`,
      {
        method: "POST",
        body: JSON.stringify(config),
      }
    ),
  getGmailConfig: (id: string) => apiCall<any>(`/inboxes/${id}/gmail-config`),
}

// 📂 Files API (only authenticated users)
export const filesAPI = {
  getAll: (inboxId?: string) =>
    apiCall<any[]>(`/files${inboxId ? `?inboxId=${inboxId}` : ""}`),
  getById: (id: string) => apiCall<any>(`/files/${id}`),
  getByInbox: (inboxId: string) => apiCall<any[]>(`/inboxes/${inboxId}/files`),
  preview: (id: string) => apiCall<any>(`/files/${id}/preview`),
  archive: (id: string) => apiCall(`/files/${id}/archive`, { method: "POST" }),
  retryImport: (id: string) => apiCall<any>(`/imports/${id}/retry`)
}

// 🗄️ Database API
export const databaseAPI = {
  testConnection: (config: any) =>
    apiCall<{ success: boolean }>("/database/test", {
      method: "POST",
      body: JSON.stringify(config),
    }),
  getTables: (id: string) =>
    apiCall<any>(`/database/tables?connectionId=${id}`),
  getColumns: (id: string, table: string) =>
    apiCall<any>(
      `/database/columns?connectionId=${id}&table=${encodeURIComponent(table)}`
    ),
  analyzeSchema: (data: any) =>
    apiCall<any>("/database/analyze-schema", {
      method: "POST",
      body: JSON.stringify({ rows: data }),
    }),
  createTableFromSchema: (data: any) =>
    apiCall<any>("/database/create-table", {
      method: "POST",
      body: JSON.stringify(data),
    }),
}

// 🔄 Mappings API
export const mappingsAPI = {
  getAll: (inboxId?: string) =>
    apiCall<any[]>(`/mappings${inboxId ? `?inboxId=${inboxId}` : ""}`),
  getById: (id: string) => apiCall<any>(`/mappings/${id}`),
  create: (data: any) =>
    apiCall<any>("/mappings", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    apiCall<any>(`/mappings/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) => apiCall(`/mappings/${id}`, { method: "DELETE" }),
}

// 🧩 Imports API
export const importAPI = {
  process: (fileId: string, mappingId: string, options: any) =>
    apiCall<any>("/imports/process", {
      method: "POST",
      body: JSON.stringify({ fileId, mappingId, ...options }),
    }),
  getAllHistory: () => apiCall<any[]>(`/imports`),
  getHistory: (inboxId?: string) =>
    apiCall<any[]>(`/imports/history${inboxId ? `?inboxId=${inboxId}` : ""}`),
  getById: (id: string) => apiCall<any>(`/imports/${id}`),
}

// 👤 Users API
export const usersAPI = {
  getAll: () => apiCall<any[]>("/users"),
  getById: (id: string) => apiCall<any>(`/users/${id}`),
  create: (data: any) =>
    apiCall<any>("/users", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    apiCall<any>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) => apiCall(`/users/${id}`, { method: "DELETE" }),
}

// ⚙️ Settings API
export const settingsAPI = {
  get: () => apiCall<any>("/settings"),
  update: (data: any) =>
    apiCall<any>("/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  getDatabaseConnections: () => apiCall<any[]>("/database"),
  deleteConnection: (id: string) =>
    apiCall<any>(`/database/${id}`, { method: "DELETE" }),
  saveDatabaseConnection: (data: any) =>
    apiCall<any>("/database", {
      method: "POST",
      body: JSON.stringify(data),
    }),
}

// 🗃️ Archive API
export const archiveAPI = {
  getArchivedFiles: () => apiCall<any[]>("/archive"),
  downloadFile: (id: string) => window.open(`/api/archive/${id}/download`, "_blank"),
}

// 🧩 Unified Export
export const api = {
  auth: authAPI,
  inboxes: inboxesAPI,
  files: filesAPI,
  database: databaseAPI,
  mappings: mappingsAPI,
  import: importAPI,
  users: usersAPI,
  settings: settingsAPI,
  archive: archiveAPI,
}
