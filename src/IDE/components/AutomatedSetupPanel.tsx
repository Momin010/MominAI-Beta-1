// 🚀 AUTOMATED SETUP PANEL
// Replaces terminal - shows automatic setup progress

import React from 'react'
import { automatedSetup, useAutomatedSetup } from '../services/automated-setup.ts'
import { useVMProvider } from '../VMProviderSwitcher.tsx'
import * as Icons from './Icon.tsx'

interface AutomatedSetupPanelProps {
  isVisible: boolean
}

export const AutomatedSetupPanel: React.FC<AutomatedSetupPanelProps> = ({ isVisible }) => {
  const { container, isConnected } = useVMProvider()
  const { status, runSetup, stopSetup, resetSetup } = useAutomatedSetup()

  const handleStartSetup = async () => {
    if (!isConnected || !container) {
      console.error('Container not connected')
      return
    }
    await runSetup()
  }

  const handleStopSetup = () => {
    stopSetup()
  }

  const handleResetSetup = () => {
    resetSetup()
  }

  if (!isVisible) return null

  return (
    <div className="h-full w-full bg-gray-900 text-gray-100 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 text-sm">⚡</span>
          <span className="text-sm font-medium">Automated Setup</span>
          <div className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`} />
        </div>

        <div className="flex items-center gap-2">
          {!status.isRunning && status.completedSteps.length === 0 && (
            <button
              onClick={handleStartSetup}
              disabled={!isConnected}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-xs rounded flex items-center gap-1"
            >
              <span className="text-xs">▶</span>
              Start Setup
            </button>
          )}

          {status.isRunning && (
            <button
              onClick={handleStopSetup}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-xs rounded flex items-center gap-1"
            >
              <span className="text-xs">⏹</span>
              Stop
            </button>
          )}

          {!status.isRunning && status.completedSteps.length > 0 && (
            <button
              onClick={handleResetSetup}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-xs rounded flex items-center gap-1"
            >
              <span className="text-xs">🔄</span>
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="p-3 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400">Progress</span>
          <span className="text-xs text-gray-400">{status.progress}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              status.currentStep === 'failed' ? 'bg-red-500' :
              status.currentStep === 'completed' ? 'bg-green-500' :
              'bg-blue-500'
            }`}
            style={{ width: `${status.progress}%` }}
          />
        </div>
        <div className="mt-2 text-xs text-gray-300 capitalize">
          {status.currentStep.replace('_', ' ')}
        </div>
      </div>

      {/* Status Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* Connection Status */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-blue-400 text-sm">🖥️</span>
            <span className="text-sm font-medium">Container Status</span>
          </div>
          <div className={`text-xs px-2 py-1 rounded ${
            isConnected ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
          }`}>
            {isConnected ? '✅ Connected' : '❌ Disconnected'}
          </div>
        </div>

        {/* Completed Steps */}
        {status.completedSteps.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-green-400 text-sm">✅</span>
              <span className="text-sm font-medium">Completed Steps</span>
            </div>
            <div className="space-y-1">
              {status.completedSteps.map((step, index) => (
                <div key={index} className="flex items-center gap-2 text-xs text-green-300">
                  <span className="text-green-400">✓</span>
                  <span className="capitalize">{step.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Activity */}
        {status.isRunning && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
              <span className="text-sm font-medium">Current Activity</span>
            </div>
            <div className="text-xs text-blue-300 bg-blue-900/30 px-2 py-1 rounded">
              {status.currentStep === 'checking_project' && '🔍 Checking project structure...'}
              {status.currentStep === 'installing_dependencies' && '📦 Installing npm dependencies...'}
              {status.currentStep === 'starting_dev_server' && '🚀 Starting development server...'}
              {status.currentStep === 'completed' && '✅ Setup completed successfully!'}
            </div>
          </div>
        )}

        {/* Errors */}
        {status.errors.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-red-400 text-sm">⚠️</span>
              <span className="text-sm font-medium">Errors</span>
            </div>
            <div className="space-y-1">
              {status.errors.map((error, index) => (
                <div key={index} className="text-xs text-red-300 bg-red-900/30 px-2 py-1 rounded">
                  {error}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        {!status.isRunning && status.completedSteps.length === 0 && (
          <div className="text-center py-8">
            <span className="text-4xl text-gray-600 mb-4 block">⚡</span>
            <h3 className="text-sm font-medium text-gray-300 mb-2">Ready for Automated Setup</h3>
            <p className="text-xs text-gray-500 mb-4">
              Click "Start Setup" to automatically install dependencies and start your dev server.
              No terminal commands needed!
            </p>
            <div className="text-xs text-gray-600 space-y-1">
              <div>• 📦 Installs npm dependencies</div>
              <div>• 🚀 Starts dev server</div>
              <div>• 🔄 Handles errors automatically</div>
              <div>• 📊 Shows real-time progress</div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {!status.isRunning && status.currentStep === 'completed' && (
          <div className="text-center py-8">
            <span className="text-4xl text-green-500 mb-4 block">✅</span>
            <h3 className="text-sm font-medium text-green-300 mb-2">Setup Complete!</h3>
            <p className="text-xs text-gray-400 mb-4">
              Your project is ready. The dev server should be running automatically.
            </p>
            <div className="text-xs text-green-400 space-y-1">
              <div>✅ Dependencies installed</div>
              <div>✅ Dev server started</div>
              <div>✅ Project ready for development</div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 bg-gray-800 border-t border-gray-700 text-xs text-gray-500">
        <div className="flex items-center justify-between">
          <span>Automated Project Setup</span>
          <span>v1.0</span>
        </div>
      </div>
    </div>
  )
}

export default AutomatedSetupPanel