// 🚀 MOMINAI REVOLUTION - SUPERIOR TYPE SYSTEM
// Beating all competitors with comprehensive, type-safe architecture

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  plan: 'free' | 'pro' | 'team' | 'enterprise'
  credits: number
  usage: {
    aiRequests: number
    deployments: number
    collaborators: number
  }
  preferences: UserPreferences
  createdAt: Date
  updatedAt: Date
}

export interface UserPreferences {
  theme: 'dark' | 'light' | 'auto'
  editor: EditorPreferences
  ai: AIPreferences
  notifications: NotificationPreferences
}

export interface EditorPreferences {
  fontSize: number
  fontFamily: string
  tabSize: number
  wordWrap: boolean
  minimap: boolean
  lineNumbers: boolean
  keyBinding: 'vscode' | 'vim' | 'emacs'
  autoSave: boolean
  formatOnSave: boolean
}

export interface AIPreferences {
  defaultModel: AIModel
  autoComplete: boolean
  contextLines: number
  aggressiveness: 'conservative' | 'balanced' | 'aggressive'
  enableVoice: boolean
  enableOffline: boolean
}

export interface NotificationPreferences {
  email: boolean
  push: boolean
  desktop: boolean
  collaboration: boolean
  deployment: boolean
}

// AI MODELS - SUPPORTING ALL MAJOR PROVIDERS (BEATING COMPETITORS)
export type AIModel = 
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'claude-3.5-sonnet'
  | 'claude-3-haiku'
  | 'gemini-2.0-flash'
  | 'gemini-1.5-pro'
  | 'llama-3.1-70b'
  | 'llama-3.1-8b'
  | 'codestral'
  | 'deepseek-coder'
  | 'local-model'

export interface AIProvider {
  id: string
  name: string
  models: AIModel[]
  apiKey?: string
  endpoint?: string
  enabled: boolean
  rateLimits: {
    requestsPerMinute: number
    tokensPerMinute: number
  }
}

// PROJECT SYSTEM - SUPERIOR TO ALL COMPETITORS
export interface Project {
  id: string
  name: string
  description?: string
  type: ProjectType
  framework: Framework
  language: ProgrammingLanguage
  files: FileSystemNode
  settings: ProjectSettings
  collaborators: Collaborator[]
  deployments: Deployment[]
  analytics: ProjectAnalytics
  createdAt: Date
  updatedAt: Date
  lastAccessedAt: Date
}

export type ProjectType = 
  | 'web-app'
  | 'mobile-app'
  | 'desktop-app'
  | 'api'
  | 'library'
  | 'game'
  | 'ai-model'
  | 'blockchain'
  | 'iot'

export type Framework = 
  | 'react'
  | 'vue'
  | 'angular'
  | 'svelte'
  | 'next'
  | 'nuxt'
  | 'express'
  | 'fastapi'
  | 'django'
  | 'rails'
  | 'spring'
  | 'flutter'
  | 'react-native'
  | 'electron'
  | 'tauri'
  | 'unity'
  | 'godot'
  | 'custom'

export type ProgrammingLanguage = 
  | 'typescript'
  | 'javascript'
  | 'python'
  | 'rust'
  | 'go'
  | 'java'
  | 'csharp'
  | 'cpp'
  | 'c'
  | 'swift'
  | 'kotlin'
  | 'dart'
  | 'php'
  | 'ruby'
  | 'scala'
  | 'clojure'
  | 'haskell'
  | 'elixir'
  | 'zig'
  | 'v'

export interface FileSystemNode {
  id: string
  name: string
  type: 'file' | 'directory'
  path: string
  content?: string
  size?: number
  children?: FileSystemNode[]
  metadata: FileMetadata
  permissions: FilePermissions
}

export interface FileMetadata {
  language?: ProgrammingLanguage
  encoding: string
  lineCount?: number
  lastModified: Date
  createdAt: Date
  checksum: string
  isGenerated: boolean
  aiAssisted: boolean
}

export interface FilePermissions {
  read: boolean
  write: boolean
  execute: boolean
  owner: string
  collaborators: string[]
}

export interface ProjectSettings {
  autoSave: boolean
  linting: boolean
  formatting: boolean
  testing: boolean
  deployment: DeploymentSettings
  collaboration: CollaborationSettings
  ai: ProjectAISettings
}

export interface DeploymentSettings {
  provider: DeploymentProvider
  environment: 'development' | 'staging' | 'production'
  autoDeployOnPush: boolean
  customDomain?: string
  environmentVariables: Record<string, string>
}

export type DeploymentProvider = 
  | 'vercel'
  | 'netlify'
  | 'railway'
  | 'render'
  | 'aws'
  | 'gcp'
  | 'azure'
  | 'digitalocean'
  | 'heroku'
  | 'fly'

export interface CollaborationSettings {
  enabled: boolean
  maxCollaborators: number
  permissions: CollaborationPermissions
  realTimeEditing: boolean
  voiceChat: boolean
  videoChat: boolean
}

export interface CollaborationPermissions {
  canEdit: boolean
  canDeploy: boolean
  canInvite: boolean
  canManageSettings: boolean
}

export interface ProjectAISettings {
  enabled: boolean
  model: AIModel
  contextAware: boolean
  autoComplete: boolean
  codeGeneration: boolean
  codeReview: boolean
  testing: boolean
  documentation: boolean
}

// COLLABORATION - REAL-TIME MULTIPLAYER CODING
export interface Collaborator {
  id: string
  user: User
  role: 'owner' | 'admin' | 'editor' | 'viewer'
  permissions: CollaborationPermissions
  status: 'online' | 'offline' | 'away'
  cursor?: CursorPosition
  selection?: EditorSelection
  joinedAt: Date
  lastActiveAt: Date
}

export interface CursorPosition {
  line: number
  column: number
  fileId: string
}

export interface EditorSelection {
  start: CursorPosition
  end: CursorPosition
  fileId: string
}

// AI SYSTEM - AUTONOMOUS AGENTS THAT ACTUALLY CODE
export interface AIAgent {
  id: string
  name: string
  type: AIAgentType
  model: AIModel
  capabilities: AICapability[]
  status: 'idle' | 'thinking' | 'coding' | 'testing' | 'deploying'
  currentTask?: AITask
  history: AIInteraction[]
  settings: AIAgentSettings
}

export type AIAgentType = 
  | 'code-assistant'
  | 'full-stack-developer'
  | 'frontend-specialist'
  | 'backend-specialist'
  | 'devops-engineer'
  | 'qa-tester'
  | 'ui-designer'
  | 'architect'
  | 'mentor'

export type AICapability = 
  | 'code-generation'
  | 'code-review'
  | 'bug-fixing'
  | 'testing'
  | 'documentation'
  | 'refactoring'
  | 'deployment'
  | 'ui-design'
  | 'database-design'
  | 'api-design'
  | 'performance-optimization'
  | 'security-audit'
  | 'mentoring'

export interface AITask {
  id: string
  type: AITaskType
  description: string
  status: 'pending' | 'in-progress' | 'completed' | 'failed'
  progress: number
  estimatedTime?: number
  actualTime?: number
  files: string[]
  changes: FileChange[]
  createdAt: Date
  completedAt?: Date
}

export type AITaskType = 
  | 'feature-implementation'
  | 'bug-fix'
  | 'code-review'
  | 'refactoring'
  | 'testing'
  | 'documentation'
  | 'optimization'
  | 'deployment'

export interface FileChange {
  fileId: string
  type: 'create' | 'update' | 'delete' | 'rename'
  oldContent?: string
  newContent?: string
  oldPath?: string
  newPath?: string
  diff: string
}

export interface AIInteraction {
  id: string
  type: 'chat' | 'command' | 'suggestion' | 'completion'
  input: string
  output: string
  model: AIModel
  tokens: {
    input: number
    output: number
  }
  duration: number
  timestamp: Date
  feedback?: 'positive' | 'negative'
}

export interface AIAgentSettings {
  autonomy: 'manual' | 'semi-autonomous' | 'fully-autonomous'
  creativity: number // 0-100
  riskTolerance: number // 0-100
  codeStyle: 'conservative' | 'modern' | 'experimental'
  testingRequired: boolean
  reviewRequired: boolean
}

// DEPLOYMENT SYSTEM - ONE-CLICK TO ANYWHERE
export interface Deployment {
  id: string
  projectId: string
  provider: DeploymentProvider
  environment: 'development' | 'staging' | 'production'
  status: DeploymentStatus
  url?: string
  customDomain?: string
  version: string
  commit: string
  buildLogs: BuildLog[]
  metrics: DeploymentMetrics
  createdAt: Date
  deployedAt?: Date
}

export type DeploymentStatus = 
  | 'pending'
  | 'building'
  | 'deploying'
  | 'deployed'
  | 'failed'
  | 'cancelled'

export interface BuildLog {
  id: string
  level: 'info' | 'warn' | 'error'
  message: string
  timestamp: Date
}

export interface DeploymentMetrics {
  buildTime: number
  deployTime: number
  bundleSize: number
  performance: {
    fcp: number // First Contentful Paint
    lcp: number // Largest Contentful Paint
    cls: number // Cumulative Layout Shift
    fid: number // First Input Delay
  }
  uptime: number
  requests: number
  errors: number
}

// ANALYTICS - COMPREHENSIVE PROJECT INSIGHTS
export interface ProjectAnalytics {
  codeMetrics: CodeMetrics
  aiUsage: AIUsageMetrics
  collaboration: CollaborationMetrics
  deployment: DeploymentAnalytics
  performance: PerformanceMetrics
}

export interface CodeMetrics {
  linesOfCode: number
  filesCount: number
  languages: Record<ProgrammingLanguage, number>
  complexity: number
  testCoverage: number
  technicalDebt: number
  codeQuality: number
}

export interface AIUsageMetrics {
  totalRequests: number
  tokensUsed: number
  modelsUsed: Record<AIModel, number>
  features: Record<AICapability, number>
  timesSaved: number // in minutes
  costSaved: number // in USD
}

export interface CollaborationMetrics {
  activeCollaborators: number
  totalCollaborators: number
  sessionsCount: number
  averageSessionDuration: number
  conflictsResolved: number
  messagesExchanged: number
}

export interface DeploymentAnalytics {
  totalDeployments: number
  successRate: number
  averageBuildTime: number
  averageDeployTime: number
  downtimeMinutes: number
  trafficStats: TrafficStats
}

export interface TrafficStats {
  uniqueVisitors: number
  pageViews: number
  bounceRate: number
  averageSessionDuration: number
  topPages: Array<{ path: string; views: number }>
  topCountries: Array<{ country: string; visitors: number }>
}

export interface PerformanceMetrics {
  loadTime: number
  bundleSize: number
  cacheHitRate: number
  errorRate: number
  apiResponseTime: number
  databaseQueryTime: number
}

// MARKETPLACE - DEVELOPER ECONOMY
export interface MarketplaceItem {
  id: string
  type: MarketplaceItemType
  name: string
  description: string
  author: User
  price: number
  currency: 'USD' | 'credits'
  rating: number
  downloads: number
  tags: string[]
  screenshots: string[]
  documentation: string
  source?: string // For open source items
  license: string
  compatibility: {
    frameworks: Framework[]
    languages: ProgrammingLanguage[]
    versions: string[]
  }
  createdAt: Date
  updatedAt: Date
}

export type MarketplaceItemType = 
  | 'template'
  | 'component'
  | 'plugin'
  | 'theme'
  | 'snippet'
  | 'ai-agent'
  | 'deployment-config'
  | 'tutorial'

// NOTIFICATIONS & EVENTS
export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, any>
  read: boolean
  userId: string
  createdAt: Date
}

export type NotificationType = 
  | 'deployment-success'
  | 'deployment-failed'
  | 'collaboration-invite'
  | 'ai-task-completed'
  | 'system-update'
  | 'billing-update'
  | 'security-alert'

// BILLING & SUBSCRIPTIONS
export interface Subscription {
  id: string
  userId: string
  plan: 'free' | 'pro' | 'team' | 'enterprise'
  status: 'active' | 'cancelled' | 'past_due' | 'unpaid'
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  stripeSubscriptionId?: string
  features: PlanFeatures
}

export interface PlanFeatures {
  aiRequests: number | 'unlimited'
  projects: number | 'unlimited'
  collaborators: number | 'unlimited'
  deployments: number | 'unlimited'
  storage: number // in GB
  bandwidth: number // in GB
  support: 'community' | 'email' | 'priority' | 'dedicated'
  advancedFeatures: string[]
}

// API RESPONSES
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: Record<string, any>
  }
  meta?: {
    pagination?: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
    timestamp: Date
    requestId: string
  }
}

// WEBSOCKET EVENTS
export interface WebSocketEvent {
  type: string
  data: any
  userId?: string
  projectId?: string
  timestamp: Date
}