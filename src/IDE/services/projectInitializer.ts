/**
 * Project Initialization Service
 * Auto-detects project types and initializes projects with appropriate configurations
 */

export interface ProjectType {
  name: string;
  framework: string;
  language: string;
  buildTool: string;
  packageManager: string;
  devScript: string;
  port: number;
  indicators: string[];
  dependencies: string[];
  devDependencies: string[];
}

export interface ProjectConfig {
  type: ProjectType;
  hasPackageJson: boolean;
  hasConfigFiles: string[];
  recommendedActions: string[];
}

export class ProjectInitializer {
  private static readonly PROJECT_TYPES: ProjectType[] = [
    {
      name: 'React + Vite',
      framework: 'React',
      language: 'TypeScript',
      buildTool: 'Vite',
      packageManager: 'npm',
      devScript: 'dev',
      port: 5173,
      indicators: ['vite.config.ts', 'vite.config.js', 'src/App.tsx', 'src/main.tsx'],
      dependencies: ['react', 'react-dom'],
      devDependencies: ['@types/react', '@types/react-dom', 'typescript', 'vite']
    },
    {
      name: 'Next.js',
      framework: 'Next.js',
      language: 'TypeScript',
      buildTool: 'Next.js',
      packageManager: 'npm',
      devScript: 'dev',
      port: 3000,
      indicators: ['next.config.js', 'pages/', 'app/', 'next-env.d.ts'],
      dependencies: ['next', 'react', 'react-dom'],
      devDependencies: ['@types/node', '@types/react', '@types/react-dom', 'typescript']
    },
    {
      name: 'Vue.js + Vite',
      framework: 'Vue',
      language: 'TypeScript',
      buildTool: 'Vite',
      packageManager: 'npm',
      devScript: 'dev',
      port: 5173,
      indicators: ['vue.config.js', 'src/App.vue', 'src/main.ts'],
      dependencies: ['vue'],
      devDependencies: ['@vue/tsconfig', 'typescript', 'vite', '@vitejs/plugin-vue']
    },
    {
      name: 'Angular',
      framework: 'Angular',
      language: 'TypeScript',
      buildTool: 'Angular CLI',
      packageManager: 'npm',
      devScript: 'start',
      port: 4200,
      indicators: ['angular.json', 'src/main.ts', 'src/app/app.component.ts'],
      dependencies: ['@angular/core', '@angular/common', '@angular/platform-browser'],
      devDependencies: ['@angular/cli', '@angular/compiler-cli', 'typescript']
    },
    {
      name: 'Node.js + Express',
      framework: 'Express',
      language: 'JavaScript',
      buildTool: 'Node.js',
      packageManager: 'npm',
      devScript: 'dev',
      port: 3000,
      indicators: ['server.js', 'app.js', 'index.js', 'express'],
      dependencies: ['express'],
      devDependencies: ['nodemon']
    },
    {
      name: 'Python Flask',
      framework: 'Flask',
      language: 'Python',
      buildTool: 'Python',
      packageManager: 'pip',
      devScript: 'run',
      port: 5000,
      indicators: ['app.py', 'flask', 'requirements.txt'],
      dependencies: ['flask'],
      devDependencies: []
    },
    {
      name: 'HTML/CSS/JS',
      framework: 'Vanilla',
      language: 'JavaScript',
      buildTool: 'None',
      packageManager: 'none',
      devScript: 'serve',
      port: 8000,
      indicators: ['index.html', 'style.css', 'script.js'],
      dependencies: [],
      devDependencies: []
    }
  ];

  static async detectProjectType(files: string[]): Promise<ProjectConfig | null> {
    const fileNames = files.map(f => f.toLowerCase());

    // Check for package.json first
    const hasPackageJson = fileNames.includes('package.json');

    let detectedType: ProjectType | null = null;
    let maxMatches = 0;
    const matchedIndicators: string[] = [];

    for (const type of this.PROJECT_TYPES) {
      let matches = 0;
      const typeMatches: string[] = [];

      for (const indicator of type.indicators) {
        if (fileNames.some(file => file.includes(indicator.toLowerCase()))) {
          matches++;
          typeMatches.push(indicator);
        }
      }

      // Special handling for package.json dependencies
      if (hasPackageJson && type.dependencies.length > 0) {
        // This would need actual package.json parsing in a real implementation
        matches += 0.5; // Partial match for having package.json
      }

      if (matches > maxMatches) {
        maxMatches = matches;
        detectedType = type;
        matchedIndicators.push(...typeMatches);
      }
    }

    if (!detectedType || maxMatches < 1) {
      return null;
    }

    const configFiles = this.getConfigFiles(detectedType);
    const recommendedActions = this.generateRecommendedActions(detectedType, hasPackageJson);

    return {
      type: detectedType,
      hasPackageJson,
      hasConfigFiles: configFiles,
      recommendedActions
    };
  }

  private static getConfigFiles(type: ProjectType): string[] {
    const configFiles: string[] = [];

    switch (type.framework) {
      case 'React':
        if (type.buildTool === 'Vite') {
          configFiles.push('vite.config.ts', 'tsconfig.json', 'index.html');
        }
        break;
      case 'Next.js':
        configFiles.push('next.config.js', 'tsconfig.json', 'tailwind.config.js');
        break;
      case 'Vue':
        configFiles.push('vite.config.ts', 'tsconfig.json', 'vue.config.js');
        break;
      case 'Angular':
        configFiles.push('angular.json', 'tsconfig.json', 'tsconfig.app.json');
        break;
      case 'Express':
        configFiles.push('package.json');
        break;
      case 'Flask':
        configFiles.push('requirements.txt', 'Procfile');
        break;
    }

    return configFiles;
  }

  private static generateRecommendedActions(type: ProjectType, hasPackageJson: boolean): string[] {
    const actions: string[] = [];

    if (!hasPackageJson) {
      actions.push(`Create package.json for ${type.name} project`);
      actions.push(`Install dependencies: ${type.dependencies.join(', ')}`);
      if (type.devDependencies.length > 0) {
        actions.push(`Install dev dependencies: ${type.devDependencies.join(', ')}`);
      }
    } else {
      actions.push('Check and update dependencies if needed');
    }

    actions.push(`Set up dev server on port ${type.port}`);
    actions.push(`Configure build scripts in package.json`);

    if (type.language === 'TypeScript') {
      actions.push('Configure TypeScript settings');
    }

    return actions;
  }

  static async initializeProject(type: ProjectType, basePath: string = '/'): Promise<void> {
    // This would create the basic project structure
    // In a real implementation, this would create files and directories

    const structure = this.getProjectStructure(type);

    console.log(`Initializing ${type.name} project at ${basePath}`);
    console.log('Project structure:', structure);

    // Here you would actually create the files using the file system API
    // For now, just log the actions that would be taken
  }

  private static getProjectStructure(type: ProjectType): any {
    // Return the basic project structure for the given type
    switch (type.framework) {
      case 'React':
        return {
          'src': {
            'App.tsx': '// React App component',
            'main.tsx': '// Entry point',
            'index.css': '/* Global styles */'
          },
          'public': {
            'index.html': '<!DOCTYPE html><html><head><title>React App</title></head><body><div id="root"></div></body></html>'
          },
          'package.json': JSON.stringify({
            name: 'react-app',
            version: '0.1.0',
            scripts: {
              dev: 'vite',
              build: 'vite build',
              preview: 'vite preview'
            },
            dependencies: Object.fromEntries(type.dependencies.map(dep => [dep, 'latest'])),
            devDependencies: Object.fromEntries(type.devDependencies.map(dep => [dep, 'latest']))
          }, null, 2)
        };
      // Add other project types...
      default:
        return {};
    }
  }

  static getAllProjectTypes(): ProjectType[] {
    return this.PROJECT_TYPES;
  }
}