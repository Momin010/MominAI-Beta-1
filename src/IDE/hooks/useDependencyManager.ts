import { useState, useCallback } from 'react';
import { useFileSystem } from './useFileSystem';
import { useNotifications } from './useNotifications';
import { useErrorRecovery } from './useErrorRecovery';
import { DependencyManager, DependencyAnalysis, PackageJsonUpdate } from '../services/dependencyManager';

export const useDependencyManager = () => {
  const { fs, updateNode } = useFileSystem();
  const { addNotification } = useNotifications();
  const { executeWithRetry } = useErrorRecovery();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<DependencyAnalysis | null>(null);

  const analyzeDependencies = useCallback(async () => {
    if (!fs?.children['package.json']) {
      addNotification({
        type: 'warning',
        message: 'No package.json found in project'
      });
      return null;
    }

    setIsAnalyzing(true);

    try {
      const packageJsonContent = fs.children['package.json'];
      if (packageJsonContent.type !== 'file') return null;

      const packageJson = JSON.parse(packageJsonContent.content);
      const result = await DependencyManager.analyzeDependencies(packageJson);

      setAnalysis(result);

      if (result.outdated.length > 0) {
        addNotification({
          type: 'info',
          message: `${result.outdated.length} packages may be outdated`
        });
      }

      if (result.recommendations.length > 0) {
        addNotification({
          type: 'info',
          message: `${result.recommendations.length} recommendations available`
        });
      }

      return result;
    } catch (error) {
      console.error('Dependency analysis failed:', error);
      addNotification({
        type: 'error',
        message: 'Failed to analyze dependencies'
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [fs, addNotification]);

  const updatePackageJson = useCallback(async (
    updates: PackageJsonUpdate,
    reason: string = 'AI-generated code'
  ) => {
    if (!fs?.children['package.json']) {
      addNotification({
        type: 'error',
        message: 'No package.json found to update'
      });
      return false;
    }

    try {
      const packageJsonContent = fs.children['package.json'];
      if (packageJsonContent.type !== 'file') return false;

      const currentPackageJson = JSON.parse(packageJsonContent.content);
      const updatedPackageJson = {
        ...currentPackageJson,
        ...updates
      };

      // Format with proper indentation
      const formattedContent = JSON.stringify(updatedPackageJson, null, 2);

      await executeWithRetry(
        () => updateNode('/package.json', formattedContent),
        'Update package.json',
        undefined,
        false
      );

      addNotification({
        type: 'success',
        message: `Updated package.json (${reason})`
      });

      // Re-analyze dependencies after update
      setTimeout(() => analyzeDependencies(), 1000);

      return true;
    } catch (error) {
      console.error('Package.json update failed:', error);
      addNotification({
        type: 'error',
        message: 'Failed to update package.json'
      });
      return false;
    }
  }, [fs, updateNode, executeWithRetry, addNotification, analyzeDependencies]);

  const autoUpdateDependencies = useCallback(async (
    code: string,
    isDev: boolean = false
  ) => {
    try {
      // Extract packages from code
      const extractedPackages = DependencyManager.extractPackagesFromCode(code);

      if (extractedPackages.length === 0) {
        return;
      }

      console.log('Extracted packages from code:', extractedPackages);

      // Get current package.json
      if (!fs?.children['package.json']) {
        addNotification({
          type: 'warning',
          message: 'No package.json found for dependency updates'
        });
        return;
      }

      const packageJsonContent = fs.children['package.json'];
      if (packageJsonContent.type !== 'file') return;

      const currentPackageJson = JSON.parse(packageJsonContent.content);

      // Update package.json with new dependencies
      const updates = await DependencyManager.updatePackageJson(
        currentPackageJson,
        extractedPackages,
        isDev
      );

      if (Object.keys(updates).length > 0) {
        const success = await updatePackageJson(updates, 'auto-detected from code');

        if (success) {
          addNotification({
            type: 'info',
            message: `Added ${extractedPackages.length} new ${isDev ? 'dev ' : ''}dependencies`
          });
        }
      }
    } catch (error) {
      console.error('Auto dependency update failed:', error);
      // Don't show error notification for auto-updates to avoid spam
    }
  }, [fs, updatePackageJson, addNotification]);

  const updateScripts = useCallback(async (
    newScripts: Record<string, string>
  ) => {
    if (!fs?.children['package.json']) {
      addNotification({
        type: 'error',
        message: 'No package.json found to update scripts'
      });
      return false;
    }

    try {
      const packageJsonContent = fs.children['package.json'];
      if (packageJsonContent.type !== 'file') return false;

      const currentPackageJson = JSON.parse(packageJsonContent.content);
      const currentScripts = currentPackageJson.scripts || {};

      const updatedScripts = DependencyManager.updateScripts(currentScripts, newScripts);

      const updates: PackageJsonUpdate = {
        scripts: updatedScripts
      };

      return await updatePackageJson(updates, 'script updates');
    } catch (error) {
      console.error('Script update failed:', error);
      addNotification({
        type: 'error',
        message: 'Failed to update scripts'
      });
      return false;
    }
  }, [fs, updatePackageJson, addNotification]);

  const getSuggestedScripts = useCallback((projectType: string) => {
    return DependencyManager.getSuggestedScripts(projectType);
  }, []);

  return {
    analyzeDependencies,
    updatePackageJson,
    autoUpdateDependencies,
    updateScripts,
    getSuggestedScripts,
    isAnalyzing,
    analysis
  };
};