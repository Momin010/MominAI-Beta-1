// 🚀 AUTOMATED PROJECT SETUP SERVICE
// Replaces visible terminal - runs everything automatically in the background

import React from 'react'
import { useVMProvider } from '../VMProviderSwitcher.tsx'

export interface AutomatedSetupConfig {
  enableAutoInstall: boolean
  enableAutoDev: boolean
  installTimeout: number
  devServerTimeout: number
  retryAttempts: number
}

export interface SetupStatus {
  isRunning: boolean
  currentStep: string
  progress: number
  errors: string[]
  completedSteps: string[]
}

class AutomatedSetupService {
  private config: AutomatedSetupConfig
  private status: SetupStatus
  private statusCallbacks: Array<(status: SetupStatus) => void> = []
  private abortController: AbortController | null = null

  constructor(config: Partial<AutomatedSetupConfig> = {}) {
    this.config = {
      enableAutoInstall: true,
      enableAutoDev: true,
      installTimeout: 180000, // 3 minutes
      devServerTimeout: 120000, // 2 minutes
      retryAttempts: 3,
      ...config
    }

    this.status = {
      isRunning: false,
      currentStep: 'idle',
      progress: 0,
      errors: [],
      completedSteps: []
    }
  }

  // Subscribe to status updates
  onStatusUpdate(callback: (status: SetupStatus) => void) {
    this.statusCallbacks.push(callback)
    return () => {
      this.statusCallbacks = this.statusCallbacks.filter(cb => cb !== callback)
    }
  }

  // Update status and notify subscribers
  private updateStatus(updates: Partial<SetupStatus>) {
    this.status = { ...this.status, ...updates }
    this.statusCallbacks.forEach(callback => callback(this.status))
  }

  // Main automated setup function
  async runAutomatedSetup(container: any): Promise<boolean> {
    if (this.status.isRunning) {
      console.log('Automated setup already running')
      return false
    }

    this.abortController = new AbortController()
    this.updateStatus({
      isRunning: true,
      currentStep: 'starting',
      progress: 0,
      errors: [],
      completedSteps: []
    })

    try {
      // Step 1: Check project structure
      await this.checkProjectStructure(container)

      // Step 2: Install dependencies (if enabled)
      if (this.config.enableAutoInstall) {
        await this.installDependencies(container)
      }

      // Step 3: Start dev server (if enabled)
      if (this.config.enableAutoDev) {
        await this.startDevServer(container)
      }

      this.updateStatus({
        isRunning: false,
        currentStep: 'completed',
        progress: 100
      })

      console.log('✅ Automated setup completed successfully!')
      return true

    } catch (error) {
      console.error('❌ Automated setup failed:', error)
      this.updateStatus({
        isRunning: false,
        currentStep: 'failed',
        errors: [...this.status.errors, error.message]
      })
      return false
    }
  }

  // Step 1: Check project structure
  private async checkProjectStructure(container: any): Promise<void> {
    this.updateStatus({ currentStep: 'checking_project', progress: 10 })

    try {
      // Check if package.json exists in the current working directory
      await container.fs.readFile('./package.json', 'utf8')
      this.updateStatus({
        completedSteps: [...this.status.completedSteps, 'package.json_found']
      })
    } catch (error) {
      // Try alternative locations
      try {
        await container.fs.readFile('package.json', 'utf8')
        this.updateStatus({
          completedSteps: [...this.status.completedSteps, 'package.json_found']
        })
      } catch (altError) {
        throw new Error('package.json not found. Please create a valid Node.js project first.')
      }
    }

    // Check if it's a valid package.json
    try {
      let packageJsonContent: string
      try {
        packageJsonContent = await container.fs.readFile('./package.json', 'utf8')
      } catch {
        packageJsonContent = await container.fs.readFile('package.json', 'utf8')
      }

      const packageJson = JSON.parse(packageJsonContent)

      if (!packageJson.name) {
        throw new Error('Invalid package.json: missing name field')
      }

      if (!packageJson.scripts || !packageJson.scripts.dev) {
        console.warn('⚠️ No dev script found in package.json. Dev server may not start automatically.')
      }

      this.updateStatus({
        completedSteps: [...this.status.completedSteps, 'package.json_valid']
      })
    } catch (error) {
      throw new Error(`Invalid package.json: ${error.message}`)
    }
  }

  // Step 2: Install dependencies automatically
  private async installDependencies(container: any): Promise<void> {
    this.updateStatus({ currentStep: 'installing_dependencies', progress: 30 })

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        console.log(`📦 Installing dependencies (attempt ${attempt}/${this.config.retryAttempts})...`)

        const installProcess = await container.spawn('npm', ['install', '--no-audit', '--no-fund'], {
          cwd: '/',
          env: {
            NODE_OPTIONS: '--max-old-space-size=256',
            npm_config_cache: '/tmp/.npm'
          }
        })

        // Set timeout
        const timeout = setTimeout(() => {
          console.warn('⏰ Installation timeout, killing process...')
          try {
            installProcess.kill()
          } catch (e) {
            console.log('Could not kill install process')
          }
        }, this.config.installTimeout)

        const exitCode = await installProcess.exit
        clearTimeout(timeout)

        if (exitCode !== 0) {
          throw new Error(`Installation failed with exit code ${exitCode}`)
        }

        console.log('✅ Dependencies installed successfully')
        this.updateStatus({
          progress: 60,
          completedSteps: [...this.status.completedSteps, 'dependencies_installed']
        })
        return

      } catch (error) {
        console.error(`❌ Installation attempt ${attempt} failed:`, error)

        if (attempt === this.config.retryAttempts) {
          throw new Error(`Failed to install dependencies after ${this.config.retryAttempts} attempts`)
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }
  }

  // Step 3: Start dev server automatically
  private async startDevServer(container: any): Promise<void> {
    this.updateStatus({ currentStep: 'starting_dev_server', progress: 70 })

    try {
      // Check if dev script exists
      const packageJson = JSON.parse(await container.fs.readFile('/package.json', 'utf8'))

      if (!packageJson.scripts || !packageJson.scripts.dev) {
        console.warn('⚠️ No dev script found, skipping dev server start')
        this.updateStatus({
          progress: 100,
          completedSteps: [...this.status.completedSteps, 'dev_server_skipped']
        })
        return
      }

      console.log('🚀 Starting dev server...')

      const devProcess = await container.spawn('npm', ['run', 'dev'], {
        cwd: '/',
        env: {
          NODE_OPTIONS: '--max-old-space-size=256',
          PORT: '5173',
          HOST: '0.0.0.0'
        }
      })

      // Monitor process
      devProcess.exit.then((code: number) => {
        console.log(`Dev server exited with code ${code}`)
        if (code !== 0) {
          this.updateStatus({
            errors: [...this.status.errors, `Dev server exited with code ${code}`]
          })
        }
      }).catch((error: any) => {
        console.error('Dev server error:', error)
        this.updateStatus({
          errors: [...this.status.errors, `Dev server error: ${error.message}`]
        })
      })

      // Wait a moment to see if it starts successfully
      await new Promise(resolve => setTimeout(resolve, 3000))

      console.log('✅ Dev server started successfully')
      this.updateStatus({
        progress: 100,
        completedSteps: [...this.status.completedSteps, 'dev_server_started']
      })

    } catch (error) {
      console.error('❌ Failed to start dev server:', error)
      throw new Error(`Dev server startup failed: ${error.message}`)
    }
  }

  // Stop automated setup
  stop() {
    if (this.abortController) {
      this.abortController.abort()
    }
    this.updateStatus({
      isRunning: false,
      currentStep: 'stopped'
    })
  }

  // Get current status
  getStatus(): SetupStatus {
    return { ...this.status }
  }

  // Reset status
  reset() {
    this.status = {
      isRunning: false,
      currentStep: 'idle',
      progress: 0,
      errors: [],
      completedSteps: []
    }
    this.statusCallbacks.forEach(callback => callback(this.status))
  }
}

// Singleton instance
export const automatedSetup = new AutomatedSetupService()

// React hook for using automated setup
export function useAutomatedSetup() {
  const { container, isConnected } = useVMProvider()
  const [status, setStatus] = React.useState<SetupStatus>(automatedSetup.getStatus())

  React.useEffect(() => {
    const unsubscribe = automatedSetup.onStatusUpdate(setStatus)
    return unsubscribe
  }, [])

  const runSetup = React.useCallback(async () => {
    if (!isConnected || !container) {
      console.error('Container not connected')
      return false
    }
    return automatedSetup.runAutomatedSetup(container)
  }, [isConnected, container])

  const stopSetup = React.useCallback(() => {
    automatedSetup.stop()
  }, [])

  const resetSetup = React.useCallback(() => {
    automatedSetup.reset()
  }, [])

  return {
    status,
    runSetup,
    stopSetup,
    resetSetup
  }
}