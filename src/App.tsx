
// 🚀 MOMINAI REVOLUTION - THE ULTIMATE AI DEVELOPMENT PLATFORM
// CRUSHING ALL COMPETITORS WITH SUPERIOR ARCHITECTURE

import React, { useEffect, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAppStore, usePerformanceStore, useKeyboardStore } from '@/stores/app-store'
import { SubscriptionProvider } from './contexts/SubscriptionContext'

// LAZY LOAD COMPONENTS FOR OPTIMAL PERFORMANCE
const LandingPage = React.lazy(() => import('./components/LandingPage'))
const Dashboard = React.lazy(() => import('./components/Dashboard'))
const IDE = React.lazy(() => import('./IDE/App'))
const CheckoutPage = React.lazy(() => import('./components/CheckoutPage'))
const Loader = React.lazy(() => import('./components/Loader'))

// ROUTE PERSISTENCE COMPONENT
const RoutePersistence: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation()

  useEffect(() => {
    // Save current route to localStorage
    localStorage.setItem('lastRoute', location.pathname + location.search)
  }, [location])

  return <>{children}</>
}

// APP ROUTER WITH PERSISTENCE
const AppRouter: React.FC = () => {
  const [isInitialLoad, setIsInitialLoad] = React.useState(true)
  const [redirectPath, setRedirectPath] = React.useState<string | null>(null)

  useEffect(() => {
    // On initial load, check for saved route
    if (isInitialLoad) {
      const lastRoute = localStorage.getItem('lastRoute')
      if (lastRoute && lastRoute !== '/' && lastRoute !== '/?') {
        setRedirectPath(lastRoute)
      }
      setIsInitialLoad(false)
    }
  }, [isInitialLoad])

  // If we have a redirect path, navigate to it
  if (redirectPath) {
    window.location.href = redirectPath
    return <LoadingScreen />
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<Dashboard onLogout={() => {}} />} />
      <Route path="/ide" element={<IDE onLogout={() => {}} />} />
      <Route path="/checkout" element={<CheckoutPage plan={null} />} />
      <Route path="/loading" element={<Loader />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

// LOADING COMPONENT
const LoadingScreen: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-black text-white">
    <div className="text-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <h2 className="text-2xl font-bold mb-2">MominAI Revolution</h2>
      <p className="text-gray-400">Loading the future of development...</p>
    </div>
  </div>
)

// ERROR BOUNDARY
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('MominAI Error:', error, errorInfo)
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-red-900/90 text-white">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Oops! Something went wrong</h1>
            <p className="text-red-200 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold"
            >
              Reload Application
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// REVOLUTIONARY APP COMPONENT
function App() {
  const { recordMetric } = usePerformanceStore()
  const { handleKeyPress, registerShortcut } = useKeyboardStore()

  // PERFORMANCE MONITORING
  useEffect(() => {
    const startTime = performance.now()
    
    // Record app load time
    const handleLoad = () => {
      const loadTime = performance.now() - startTime
      recordMetric('appLoadTime', loadTime)
    }

    // Monitor memory usage
    const monitorMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        recordMetric('memoryUsage', memory.usedJSHeapSize)
      }
    }

    window.addEventListener('load', handleLoad)
    
    // Monitor performance every 30 seconds
    const performanceInterval = setInterval(monitorMemory, 30000)

    return () => {
      window.removeEventListener('load', handleLoad)
      clearInterval(performanceInterval)
    }
  }, [recordMetric])

  // GLOBAL KEYBOARD SHORTCUTS
  useEffect(() => {
    // Register global shortcuts
    registerShortcut('Ctrl+k', () => {
      console.log('Command palette opened')
    })

    registerShortcut('Ctrl+Shift+p', () => {
      console.log('AI chat opened')
    })

    registerShortcut('Ctrl+`', () => {
      console.log('Terminal toggled')
    })

    // Global keyboard event handler
    const handleKeyDown = (event: KeyboardEvent) => {
      handleKeyPress(event)
    }

    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [registerShortcut, handleKeyPress])

  // PWA INSTALLATION PROMPT
  useEffect(() => {
    let deferredPrompt: any

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      deferredPrompt = e
      console.log('PWA install prompt available')
    }

    const handleAppInstalled = () => {
      console.log('PWA installed successfully')
      deferredPrompt = null
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  return (
    <ErrorBoundary>
      <SubscriptionProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <RoutePersistence>
            <div className="app min-h-screen">
              <Suspense fallback={<LoadingScreen />}>
                <AppRouter />
              </Suspense>
            </div>
          </RoutePersistence>
        </Router>
      </SubscriptionProvider>
    </ErrorBoundary>
  )
}

export default App