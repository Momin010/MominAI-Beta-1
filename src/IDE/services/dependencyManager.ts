/**
 * Smart Dependency Management Service
 * Automatically manages package.json updates and dependency analysis
 */

export interface PackageInfo {
  name: string;
  version: string;
  isDev: boolean;
  latestVersion?: string;
  isOutdated: boolean;
}

export interface DependencyAnalysis {
  dependencies: PackageInfo[];
  devDependencies: PackageInfo[];
  missing: string[];
  unused: string[];
  outdated: PackageInfo[];
  recommendations: string[];
}

export interface PackageJsonUpdate {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}

export class DependencyManager {
  private static readonly COMMON_PACKAGES = {
    // React ecosystem
    'react': '^18.2.0',
    'react-dom': '^18.2.0',
    '@types/react': '^18.2.0',
    '@types/react-dom': '^18.2.0',

    // Build tools
    'vite': '^6.2.0',
    'webpack': '^5.90.0',
    'rollup': '^4.0.0',

    // TypeScript
    'typescript': '~5.8.2',
    '@types/node': '^22.14.0',

    // Testing
    'jest': '^29.7.0',
    '@testing-library/react': '^14.0.0',
    '@testing-library/jest-dom': '^6.0.0',

    // Linting
    'eslint': '^8.57.0',
    '@typescript-eslint/parser': '^6.0.0',
    '@typescript-eslint/eslint-plugin': '^6.0.0',

    // Styling
    'tailwindcss': '^3.4.0',
    'autoprefixer': '^10.4.0',
    'postcss': '^8.4.0',

    // State management
    'zustand': '^4.4.0',
    'redux': '^9.0.0',
    '@reduxjs/toolkit': '^2.0.0',

    // HTTP clients
    'axios': '^1.6.0',
    'fetch': '^1.1.0',

    // Utilities
    'lodash': '^4.17.0',
    'date-fns': '^3.0.0',
    'clsx': '^2.0.0',
    'tailwind-merge': '^2.0.0'
  };

  // Analyze package.json and provide recommendations
  static async analyzeDependencies(packageJson: any): Promise<DependencyAnalysis> {
    const analysis: DependencyAnalysis = {
      dependencies: [],
      devDependencies: [],
      missing: [],
      unused: [],
      outdated: [],
      recommendations: []
    };

    // Analyze regular dependencies
    if (packageJson.dependencies) {
      for (const [name, version] of Object.entries(packageJson.dependencies)) {
        const packageInfo: PackageInfo = {
          name,
          version: version as string,
          isDev: false,
          isOutdated: false
        };

        // Check if outdated (simplified - in real implementation would check npm registry)
        if (this.isLikelyOutdated(version as string)) {
          packageInfo.isOutdated = true;
          analysis.outdated.push(packageInfo);
        }

        analysis.dependencies.push(packageInfo);
      }
    }

    // Analyze dev dependencies
    if (packageJson.devDependencies) {
      for (const [name, version] of Object.entries(packageJson.devDependencies)) {
        const packageInfo: PackageInfo = {
          name,
          version: version as string,
          isDev: true,
          isOutdated: false
        };

        if (this.isLikelyOutdated(version as string)) {
          packageInfo.isOutdated = true;
          analysis.outdated.push(packageInfo);
        }

        analysis.devDependencies.push(packageInfo);
      }
    }

    // Generate recommendations
    analysis.recommendations = this.generateRecommendations(packageJson, analysis);

    return analysis;
  }

  // Auto-update package.json when AI suggests new packages
  static async updatePackageJson(
    currentPackageJson: any,
    newPackages: string[],
    isDev: boolean = false
  ): Promise<PackageJsonUpdate> {
    const update: PackageJsonUpdate = {};

    if (newPackages.length === 0) return update;

    const targetSection = isDev ? 'devDependencies' : 'dependencies';
    const currentDeps = currentPackageJson[targetSection] || {};

    // Add new packages with appropriate versions
    const newDeps: Record<string, string> = {};
    for (const packageName of newPackages) {
      if (!currentDeps[packageName]) {
        const version = this.COMMON_PACKAGES[packageName] || 'latest';
        newDeps[packageName] = version;
      }
    }

    if (Object.keys(newDeps).length > 0) {
      update[targetSection] = {
        ...currentDeps,
        ...newDeps
      };
    }

    return update;
  }

  // Extract package names from AI-generated code
  static extractPackagesFromCode(code: string): string[] {
    const packages: string[] = [];
    const importPatterns = [
      /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g,
      /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
      /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g
    ];

    for (const pattern of importPatterns) {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        const packageName = match[1];

        // Skip relative imports and built-in modules
        if (!packageName.startsWith('.') &&
            !packageName.startsWith('/') &&
            !this.isBuiltInModule(packageName)) {
          // Extract package name (remove sub-paths)
          const mainPackage = packageName.split('/')[0];
          if (!packages.includes(mainPackage)) {
            packages.push(mainPackage);
          }
        }
      }
    }

    return packages;
  }

  // Check if a package is a built-in Node.js module
  private static isBuiltInModule(moduleName: string): boolean {
    const builtIns = [
      'fs', 'path', 'http', 'https', 'url', 'querystring', 'events',
      'util', 'stream', 'crypto', 'zlib', 'os', 'child_process',
      'cluster', 'dgram', 'dns', 'net', 'readline', 'repl', 'tls',
      'tty', 'vm', 'v8', 'buffer', 'constants', 'module'
    ];

    return builtIns.includes(moduleName);
  }

  // Check if a version string indicates an outdated package
  private static isLikelyOutdated(version: string): boolean {
    // Simple heuristic - packages with ^0.x or ~0.x are likely outdated
    return version.startsWith('^0.') || version.startsWith('~0.') || version === '*';
  }

  // Generate recommendations based on project analysis
  private static generateRecommendations(
    packageJson: any,
    analysis: DependencyAnalysis
  ): string[] {
    const recommendations: string[] = [];

    // Check for common missing packages based on project type
    if (this.isReactProject(packageJson)) {
      if (!packageJson.dependencies?.react) {
        recommendations.push('Add React as a dependency');
      }
      if (!packageJson.devDependencies?.['@types/react']) {
        recommendations.push('Add @types/react for TypeScript support');
      }
    }

    if (this.isTypeScriptProject(packageJson)) {
      if (!packageJson.devDependencies?.typescript) {
        recommendations.push('Add TypeScript as a dev dependency');
      }
    }

    // Check for testing setup
    if (!packageJson.devDependencies?.jest && !packageJson.devDependencies?.vitest) {
      recommendations.push('Consider adding a testing framework (Jest or Vitest)');
    }

    // Check for linting
    if (!packageJson.devDependencies?.eslint) {
      recommendations.push('Consider adding ESLint for code quality');
    }

    // Outdated packages
    if (analysis.outdated.length > 0) {
      recommendations.push(`Update ${analysis.outdated.length} outdated packages`);
    }

    return recommendations;
  }

  // Detect project types
  private static isReactProject(packageJson: any): boolean {
    return !!(packageJson.dependencies?.react || packageJson.devDependencies?.['@types/react']);
  }

  private static isTypeScriptProject(packageJson: any): boolean {
    return !!packageJson.devDependencies?.typescript;
  }

  // Auto-install missing dependencies
  static async autoInstallDependencies(
    missingPackages: string[],
    isDev: boolean = false
  ): Promise<string[]> {
    if (missingPackages.length === 0) return [];

    const installed: string[] = [];

    // In a real implementation, this would run npm install
    // For now, just simulate the process
    for (const packageName of missingPackages) {
      console.log(`${isDev ? 'Installing dev dependency' : 'Installing dependency'}: ${packageName}`);
      installed.push(packageName);
    }

    return installed;
  }

  // Update package.json with new scripts
  static updateScripts(
    currentScripts: Record<string, string>,
    newScripts: Record<string, string>
  ): Record<string, string> {
    return {
      ...currentScripts,
      ...newScripts
    };
  }

  // Get suggested scripts for a project type
  static getSuggestedScripts(projectType: string): Record<string, string> {
    switch (projectType.toLowerCase()) {
      case 'react':
      case 'vite':
        return {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview',
          lint: 'eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0'
        };
      case 'next.js':
        return {
          dev: 'next dev',
          build: 'next build',
          start: 'next start',
          lint: 'next lint'
        };
      case 'node':
        return {
          start: 'node index.js',
          dev: 'nodemon index.js',
          test: 'jest'
        };
      default:
        return {
          build: 'echo "Build script not configured"',
          test: 'echo "Test script not configured"'
        };
    }
  }
}