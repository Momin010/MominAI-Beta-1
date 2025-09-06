// 🚀 MOMINAI REVOLUTION - SUPERIOR STATE MANAGEMENT
// BEATING COMPETITORS WITH BLAZING FAST, TYPE-SAFE STATE

import { create } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import type { 
  User, 
  Project, 
  AIModel, 
  AIAgent, 
  Collaborator, 
  Notification,
  UserPreferences,
  FileSystemNode
} from '@/types'

// MAIN APP STATE - SUPERIOR TO ALL COMPETITORS
interface AppState {
  // USER STATE
  user: User | null
  isAuthenticated: boolean
  subscription: {
    plan: 'free' | 'pro' | 'team' | 'enterprise'
    credits: number
    usage: {
      aiRequests: number
      deployments: number
      collaborators: number
    }
  }

  // PROJECT STATE
  currentProject: Project | null
  projects: Project[]
  recentProjects: Project[]

  // AI STATE - MULTI-MODEL SUPPORT (BEATING CURSOR/WINDSURF)
  aiModels: AIModel[]
  selectedAIModel: AIModel
  aiAgents: AIAgent[]
  activeAgent: AIAgent | null
  aiHistory: Array<{
    id: string
    model: AIModel
    input: string
    output: string
    timestamp: Date
    tokens: number
  }>

  // EDITOR STATE
  openFiles: Array<{
    id: string
    path: string
    content: string
    isDirty: boolean
    language: string
  }>
  activeFileId: string | null
  editorSettings: {
    theme: 'dark' | 'light' | 'auto'
    fontSize: number
    fontFamily: string
    tabSize: number
    wordWrap: boolean
    minimap: boolean
    lineNumbers: boolean
    keyBinding: 'vscode' | 'vim' | 'emacs'
  }

  // COLLABORATION STATE - REAL-TIME MULTIPLAYER
  collaborators: Collaborator[]
  isCollaborationEnabled: boolean
  cursors: Map<string, { line: number; column: number; fileId: string }>
  selections: Map<string, { start: { line: number; column: number }; end: { line: number; column: number }; fileId: string }>

  // UI STATE
  sidebarOpen: boolean
  panelOpen: boolean
  activePanel: 'terminal' | 'ai-chat' | 'files' | 'git' | 'extensions' | 'settings'
  notifications: Notification[]
  isLoading: boolean
  error: string | null

  // PERFORMANCE STATE
  performance: {
    loadTime: number
    memoryUsage: number
    cpuUsage: number
    networkLatency: number
  }

  // ACTIONS
  setUser: (user: User | null) => void
  setCurrentProject: (project: Project | null) => void
  addProject: (project: Project) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void

  // AI ACTIONS
  setSelectedAIModel: (model: AIModel) => void
  addAIInteraction: (interaction: any) => void
  setActiveAgent: (agent: AIAgent | null) => void

  // EDITOR ACTIONS
  openFile: (file: { id: string; path: string; content: string; language: string }) => void
  closeFile: (id: string) => void
  updateFileContent: (id: string, content: string) => void
  setActiveFile: (id: string) => void
  updateEditorSettings: (settings: Partial<AppState['editorSettings']>) => void

  // COLLABORATION ACTIONS
  addCollaborator: (collaborator: Collaborator) => void
  removeCollaborator: (id: string) => void
  updateCursor: (userId: string, cursor: { line: number; column: number; fileId: string }) => void
  updateSelection: (userId: string, selection: any) => void

  // UI ACTIONS
  toggleSidebar: () => void
  togglePanel: () => void
  setActivePanel: (panel: AppState['activePanel']) => void
  addNotification: (notification: Notification) => void
  removeNotification: (id: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // PERFORMANCE ACTIONS
  updatePerformance: (metrics: Partial<AppState['performance']>) => void
}

// CREATE THE STORE WITH MIDDLEWARE
export const useAppStore = create<AppState>()(
  devtools(
    persist(
      subscribeWithSelector((set, get) => ({
        // INITIAL STATE
        user: null,
        isAuthenticated: false,
        subscription: {
          plan: 'free',
          credits: 1000,
          usage: {
            aiRequests: 0,
            deployments: 0,
            collaborators: 0
          }
        },

        currentProject: null,
        projects: [],
        recentProjects: [],

        aiModels: ['gpt-4o', 'claude-3.5-sonnet', 'gemini-2.0-flash'],
        selectedAIModel: 'claude-3.5-sonnet',
        aiAgents: [],
        activeAgent: null,
        aiHistory: [],

        openFiles: [],
        activeFileId: null,
        editorSettings: {
          theme: 'dark',
          fontSize: 14,
          fontFamily: 'JetBrains Mono',
          tabSize: 2,
          wordWrap: true,
          minimap: true,
          lineNumbers: true,
          keyBinding: 'vscode'
        },

        collaborators: [],
        isCollaborationEnabled: false,
        cursors: new Map(),
        selections: new Map(),

        sidebarOpen: true,
        panelOpen: true,
        activePanel: 'files',
        notifications: [],
        isLoading: false,
        error: null,

        performance: {
          loadTime: 0,
          memoryUsage: 0,
          cpuUsage: 0,
          networkLatency: 0
        },

        // USER ACTIONS
        setUser: (user) => set({ user, isAuthenticated: !!user }),

        // PROJECT ACTIONS
        setCurrentProject: (project) => {
          set({ currentProject: project })
          
          // Add to recent projects
          if (project) {
            const recentProjects = get().recentProjects.filter(p => p.id !== project.id)
            recentProjects.unshift(project)
            set({ recentProjects: recentProjects.slice(0, 10) })
          }
        },

        addProject: (project) => {
          set(state => ({
            projects: [...state.projects, project]
          }))
        },

        updateProject: (id, updates) => {
          set(state => ({
            projects: state.projects.map(p => p.id === id ? { ...p, ...updates } : p),
            currentProject: state.currentProject?.id === id 
              ? { ...state.currentProject, ...updates }
              : state.currentProject
          }))
        },

        deleteProject: (id) => {
          set(state => ({
            projects: state.projects.filter(p => p.id !== id),
            recentProjects: state.recentProjects.filter(p => p.id !== id),
            currentProject: state.currentProject?.id === id ? null : state.currentProject
          }))
        },

        // AI ACTIONS
        setSelectedAIModel: (model) => set({ selectedAIModel: model }),

        addAIInteraction: (interaction) => {
          set(state => ({
            aiHistory: [interaction, ...state.aiHistory].slice(0, 100) // Keep last 100
          }))
        },

        setActiveAgent: (agent) => set({ activeAgent: agent }),

        // EDITOR ACTIONS
        openFile: (file) => {
          set(state => {
            const existingFile = state.openFiles.find(f => f.id === file.id)
            if (existingFile) {
              return { activeFileId: file.id }
            }
            
            return {
              openFiles: [...state.openFiles, { ...file, isDirty: false }],
              activeFileId: file.id
            }
          })
        },

        closeFile: (id) => {
          set(state => {
            const newOpenFiles = state.openFiles.filter(f => f.id !== id)
            const newActiveFileId = state.activeFileId === id 
              ? (newOpenFiles.length > 0 ? newOpenFiles[0].id : null)
              : state.activeFileId
            
            return {
              openFiles: newOpenFiles,
              activeFileId: newActiveFileId
            }
          })
        },

        updateFileContent: (id, content) => {
          set(state => ({
            openFiles: state.openFiles.map(f => 
              f.id === id 
                ? { ...f, content, isDirty: true }
                : f
            )
          }))
        },

        setActiveFile: (id) => set({ activeFileId: id }),

        updateEditorSettings: (settings) => {
          set(state => ({
            editorSettings: { ...state.editorSettings, ...settings }
          }))
        },

        // COLLABORATION ACTIONS
        addCollaborator: (collaborator) => {
          set(state => ({
            collaborators: [...state.collaborators.filter(c => c.id !== collaborator.id), collaborator]
          }))
        },

        removeCollaborator: (id) => {
          set(state => ({
            collaborators: state.collaborators.filter(c => c.id !== id)
          }))
        },

        updateCursor: (userId, cursor) => {
          set(state => {
            const newCursors = new Map(state.cursors)
            newCursors.set(userId, cursor)
            return { cursors: newCursors }
          })
        },

        updateSelection: (userId, selection) => {
          set(state => {
            const newSelections = new Map(state.selections)
            newSelections.set(userId, selection)
            return { selections: newSelections }
          })
        },

        // UI ACTIONS
        toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
        togglePanel: () => set(state => ({ panelOpen: !state.panelOpen })),
        setActivePanel: (panel) => set({ activePanel: panel }),

        addNotification: (notification) => {
          set(state => ({
            notifications: [notification, ...state.notifications]
          }))
        },

        removeNotification: (id) => {
          set(state => ({
            notifications: state.notifications.filter(n => n.id !== id)
          }))
        },

        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),

        // PERFORMANCE ACTIONS
        updatePerformance: (metrics) => {
          set(state => ({
            performance: { ...state.performance, ...metrics }
          }))
        }
      })),
      {
        name: 'mominai-app-store',
        partialize: (state) => ({
          user: state.user,
          projects: state.projects,
          recentProjects: state.recentProjects,
          selectedAIModel: state.selectedAIModel,
          editorSettings: state.editorSettings,
          sidebarOpen: state.sidebarOpen,
          panelOpen: state.panelOpen,
          activePanel: state.activePanel
        })
      }
    ),
    { name: 'MominAI App Store' }
  )
)

// SELECTORS FOR PERFORMANCE
export const useUser = () => useAppStore(state => state.user)
export const useCurrentProject = () => useAppStore(state => state.currentProject)
export const useProjects = () => useAppStore(state => state.projects)
export const useOpenFiles = () => useAppStore(state => state.openFiles)
export const useActiveFile = () => useAppStore(state => {
  const { openFiles, activeFileId } = state
  return openFiles.find(f => f.id === activeFileId) || null
})
export const useCollaborators = () => useAppStore(state => state.collaborators)
export const useNotifications = () => useAppStore(state => state.notifications)
export const useAIModels = () => useAppStore(state => state.aiModels)
export const useSelectedAIModel = () => useAppStore(state => state.selectedAIModel)
export const useEditorSettings = () => useAppStore(state => state.editorSettings)

// PERFORMANCE MONITORING STORE
interface PerformanceState {
  metrics: {
    renderTime: number
    bundleSize: number
    memoryUsage: number
    networkRequests: number
    errorCount: number
  }
  history: Array<{
    timestamp: Date
    metrics: any
  }>
  
  recordMetric: (name: string, value: number) => void
  recordError: (error: Error) => void
  getAverageMetric: (name: string) => number
}

export const usePerformanceStore = create<PerformanceState>()(
  devtools((set, get) => ({
    metrics: {
      renderTime: 0,
      bundleSize: 0,
      memoryUsage: 0,
      networkRequests: 0,
      errorCount: 0
    },
    history: [],

    recordMetric: (name, value) => {
      set(state => ({
        metrics: { ...state.metrics, [name]: value },
        history: [
          ...state.history.slice(-99), // Keep last 100 entries
          { timestamp: new Date(), metrics: { [name]: value } }
        ]
      }))
    },

    recordError: (error) => {
      set(state => ({
        metrics: { ...state.metrics, errorCount: state.metrics.errorCount + 1 }
      }))
      
      // Send to error tracking service
      console.error('MominAI Error:', error)
    },

    getAverageMetric: (name) => {
      const history = get().history
      const values = history
        .filter(h => h.metrics[name] !== undefined)
        .map(h => h.metrics[name])
      
      return values.length > 0 
        ? values.reduce((sum, val) => sum + val, 0) / values.length
        : 0
    }
  }), { name: 'MominAI Performance Store' })
)

// WEBSOCKET STORE FOR REAL-TIME COLLABORATION
interface WebSocketState {
  socket: WebSocket | null
  connected: boolean
  reconnectAttempts: number
  
  connect: (url: string) => void
  disconnect: () => void
  send: (data: any) => void
  onMessage: (handler: (data: any) => void) => void
}

export const useWebSocketStore = create<WebSocketState>()(
  devtools((set, get) => ({
    socket: null,
    connected: false,
    reconnectAttempts: 0,

    connect: (url) => {
      const socket = new WebSocket(url)
      
      socket.onopen = () => {
        set({ socket, connected: true, reconnectAttempts: 0 })
      }
      
      socket.onclose = () => {
        set({ connected: false })
        
        // Auto-reconnect with exponential backoff
        const attempts = get().reconnectAttempts
        if (attempts < 5) {
          setTimeout(() => {
            set({ reconnectAttempts: attempts + 1 })
            get().connect(url)
          }, Math.pow(2, attempts) * 1000)
        }
      }
      
      socket.onerror = (error) => {
        console.error('WebSocket error:', error)
        usePerformanceStore.getState().recordError(new Error('WebSocket connection failed'))
      }
    },

    disconnect: () => {
      const socket = get().socket
      if (socket) {
        socket.close()
        set({ socket: null, connected: false })
      }
    },

    send: (data) => {
      const socket = get().socket
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(data))
      }
    },

    onMessage: (handler) => {
      const socket = get().socket
      if (socket) {
        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            handler(data)
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error)
          }
        }
      }
    }
  }), { name: 'MominAI WebSocket Store' })
)

// KEYBOARD SHORTCUTS STORE
interface KeyboardState {
  shortcuts: Map<string, () => void>
  
  registerShortcut: (key: string, handler: () => void) => void
  unregisterShortcut: (key: string) => void
  handleKeyPress: (event: KeyboardEvent) => boolean
}

export const useKeyboardStore = create<KeyboardState>()(
  devtools((set, get) => ({
    shortcuts: new Map(),

    registerShortcut: (key, handler) => {
      set(state => {
        const newShortcuts = new Map(state.shortcuts)
        newShortcuts.set(key, handler)
        return { shortcuts: newShortcuts }
      })
    },

    unregisterShortcut: (key) => {
      set(state => {
        const newShortcuts = new Map(state.shortcuts)
        newShortcuts.delete(key)
        return { shortcuts: newShortcuts }
      })
    },

    handleKeyPress: (event) => {
      const key = `${event.ctrlKey ? 'Ctrl+' : ''}${event.shiftKey ? 'Shift+' : ''}${event.altKey ? 'Alt+' : ''}${event.key}`
      const handler = get().shortcuts.get(key)
      
      if (handler) {
        event.preventDefault()
        handler()
        return true
      }
      
      return false
    }
  }), { name: 'MominAI Keyboard Store' })
)