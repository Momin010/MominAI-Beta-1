import { useState, useCallback } from 'react';
import { useFileSystem } from './useFileSystem';
import { useNotifications } from './useNotifications';
import { ProjectInitializer, ProjectConfig, ProjectType } from '../services/projectInitializer';

export const useProjectInitializer = () => {
  const { fs, createNode } = useFileSystem();
  const { addNotification } = useNotifications();
  const [isInitializing, setIsInitializing] = useState(false);
  const [detectedConfig, setDetectedConfig] = useState<ProjectConfig | null>(null);

  const detectProjectType = useCallback(async () => {
    if (!fs) return null;

    try {
      // Get all files in the project
      const allFiles = Object.keys(fs.children);

      const config = await ProjectInitializer.detectProjectType(allFiles);
      setDetectedConfig(config);

      if (config) {
        addNotification({
          type: 'info',
          message: `Detected ${config.type.name} project`
        });
      } else {
        addNotification({
          type: 'info',
          message: 'Project type not detected. You can initialize a new project.'
        });
      }

      return config;
    } catch (error) {
      console.error('Project detection failed:', error);
      addNotification({
        type: 'error',
        message: 'Failed to detect project type'
      });
      return null;
    }
  }, [fs, addNotification]);

  const initializeProject = useCallback(async (type: ProjectType, basePath: string = '/') => {
    setIsInitializing(true);

    try {
      addNotification({
        type: 'info',
        message: `Initializing ${type.name} project...`
      });

      // Create basic project structure
      await ProjectInitializer.initializeProject(type, basePath);

      // Create package.json if it doesn't exist
      if (!fs?.children['package.json']) {
        const packageJson = {
          name: type.name.toLowerCase().replace(/\s+/g, '-'),
          version: '0.1.0',
          scripts: {
            [type.devScript]: type.devScript === 'dev' ? 'vite' : 'node server.js',
            build: type.buildTool === 'Vite' ? 'vite build' : 'echo "Build command not configured"',
            start: 'npm run dev'
          },
          dependencies: Object.fromEntries(type.dependencies.map(dep => [dep, 'latest'])),
          devDependencies: Object.fromEntries(type.devDependencies.map(dep => [dep, 'latest']))
        };

        await createNode('/package.json', 'file', JSON.stringify(packageJson, null, 2));
      }

      addNotification({
        type: 'success',
        message: `${type.name} project initialized successfully!`
      });

      // Re-detect project type after initialization
      await detectProjectType();

    } catch (error) {
      console.error('Project initialization failed:', error);
      addNotification({
        type: 'error',
        message: `Failed to initialize ${type.name} project`
      });
    } finally {
      setIsInitializing(false);
    }
  }, [fs, createNode, addNotification, detectProjectType]);

  const getAvailableProjectTypes = useCallback(() => {
    return ProjectInitializer.getAllProjectTypes();
  }, []);

  return {
    detectProjectType,
    initializeProject,
    getAvailableProjectTypes,
    isInitializing,
    detectedConfig
  };
};