import { useEffect, useState, useCallback } from 'react';
import { useRemoteVM } from '../WebContainerProvider.tsx';
import { useNotifications } from './useNotifications';

export interface TerminalAutomationState {
  isInstalling: boolean;
  isStartingDev: boolean;
  installProgress: number;
  devProgress: number;
  currentStep: string;
  error: string | null;
}

export const useTerminalAutomation = () => {
  const { container, isConnected } = useRemoteVM();
  const { addNotification } = useNotifications();
  const [state, setState] = useState<TerminalAutomationState>({
    isInstalling: false,
    isStartingDev: false,
    installProgress: 0,
    devProgress: 0,
    currentStep: '',
    error: null
  });

  const runNpmInstall = useCallback(async () => {
    if (!container || !isConnected) {
      console.log('Terminal automation: WebContainer not connected, skipping npm install');
      return;
    }

    // Check if we're actually in a WebContainer environment
    // WebContainer paths start with '/' and don't contain Windows-style paths
    const isWebContainerEnv = window.location.hostname.includes('stackblitz') ||
                             window.location.hostname.includes('webcontainer') ||
                             (container && typeof container.fs?.readFile === 'function');

    if (!isWebContainerEnv) {
      console.log('Terminal automation: Not in WebContainer environment, skipping npm install');
      return;
    }

    setState(prev => ({
      ...prev,
      isInstalling: true,
      installProgress: 0,
      currentStep: 'Checking package.json...',
      error: null
    }));

    try {
      // Check if package.json exists
      await container.fs.readFile('/package.json', 'utf8');
      setState(prev => ({ ...prev, currentStep: 'Installing dependencies...', installProgress: 10 }));

      // Run npm install
      const installProcess = await container.spawn('npm', ['install', '--no-audit', '--no-fund'], {
        cwd: '/',
        env: {
          NODE_OPTIONS: '--max-old-space-size=256',
          npm_config_cache: '/tmp/.npm'
        }
      });

      // Monitor progress (simulated)
      const progressInterval = setInterval(() => {
        setState(prev => ({
          ...prev,
          installProgress: Math.min(prev.installProgress + 5, 90)
        }));
      }, 1000);

      const installExitCode = await installProcess.exit;
      clearInterval(progressInterval);

      if (installExitCode !== 0) {
        throw new Error(`Installation failed with exit code ${installExitCode}`);
      }

      setState(prev => ({
        ...prev,
        installProgress: 100,
        currentStep: 'Dependencies installed successfully!',
        isInstalling: false
      }));

      addNotification({ type: 'success', message: 'Dependencies installed successfully' });

      // Automatically start dev server after install
      setTimeout(() => runNpmDev(), 1000);

    } catch (error) {
      console.error('NPM install failed:', error);
      setState(prev => ({
        ...prev,
        isInstalling: false,
        error: error instanceof Error ? error.message : 'Installation failed'
      }));
      addNotification({
        type: 'error',
        message: `Installation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }, [container, isConnected, addNotification]);

  const runNpmDev = useCallback(async () => {
    if (!container || !isConnected) {
      console.log('Terminal automation: WebContainer not connected, skipping npm dev');
      return;
    }

    // Check if we're actually in a WebContainer environment
    const isWebContainerEnv = window.location.hostname.includes('stackblitz') ||
                             window.location.hostname.includes('webcontainer') ||
                             (container && typeof container.fs?.readFile === 'function');

    if (!isWebContainerEnv) {
      console.log('Terminal automation: Not in WebContainer environment, skipping npm dev');
      return;
    }

    setState(prev => ({
      ...prev,
      isStartingDev: true,
      devProgress: 0,
      currentStep: 'Checking dev script...',
      error: null
    }));

    try {
      // Check if dev script exists
      const packageJson = JSON.parse(await container.fs.readFile('/package.json', 'utf8'));
      if (!packageJson.scripts || !packageJson.scripts.dev) {
        throw new Error('No dev script found in package.json');
      }

      setState(prev => ({ ...prev, currentStep: 'Starting dev server...', devProgress: 20 }));

      // Start dev server
      const devProcess = await container.spawn('npm', ['run', 'dev'], {
        cwd: '/',
        env: {
          NODE_OPTIONS: '--max-old-space-size=256',
          PORT: '5173',
          HOST: '0.0.0.0'
        }
      });

      setState(prev => ({ ...prev, devProgress: 50, currentStep: 'Dev server starting...' }));

      // Monitor for successful start (look for listening message)
      let started = false;
      const outputHandler = (data: string) => {
        if (!started && (data.includes('Local:') || data.includes('ready') || data.includes('listening'))) {
          started = true;
          setState(prev => ({
            ...prev,
            devProgress: 100,
            currentStep: 'Dev server running!',
            isStartingDev: false
          }));
          addNotification({ type: 'success', message: 'Dev server started successfully' });
        }
      };

      // Listen to process output
      devProcess.output.pipeTo(new WritableStream({
        write(data) {
          const text = typeof data === 'string' ? data : new TextDecoder().decode(data);
          outputHandler(text);
        }
      }));

      // Timeout after 30 seconds if not started
      setTimeout(() => {
        if (!started) {
          setState(prev => ({
            ...prev,
            devProgress: 100,
            currentStep: 'Dev server may be running (timeout reached)',
            isStartingDev: false
          }));
          addNotification({ type: 'info', message: 'Dev server startup timeout - may still be running' });
        }
      }, 30000);

    } catch (error) {
      console.error('NPM dev failed:', error);
      setState(prev => ({
        ...prev,
        isStartingDev: false,
        error: error instanceof Error ? error.message : 'Dev server failed to start'
      }));
      addNotification({
        type: 'error',
        message: `Dev server failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }, [container, isConnected, addNotification]);

  const triggerAutomation = useCallback((actions: any[]) => {
    // Check if we're in a WebContainer environment before attempting automation
    const isWebContainerEnv = window.location.hostname.includes('stackblitz') ||
                             window.location.hostname.includes('webcontainer') ||
                             (container && typeof container.fs?.readFile === 'function');

    if (!isWebContainerEnv) {
      console.log('Terminal automation: Not in WebContainer environment, skipping automation trigger');
      return;
    }

    // Check if any actions created/modified package.json or added dependencies
    const hasPackageChanges = actions.some(action =>
      action.path === '/package.json' ||
      action.path.includes('package.json') ||
      (action.content && action.content.includes('dependencies'))
    );

    if (hasPackageChanges) {
      console.log('AI completion detected package changes, triggering npm install...');
      runNpmInstall();
    }
  }, [runNpmInstall, container]);

  return {
    state,
    triggerAutomation,
    runNpmInstall,
    runNpmDev
  };
};