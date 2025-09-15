// 🚀 AUTONOMOUS AI DEVELOPMENT AGENT
// The revolutionary AI that actually reads, understands, and builds complete features

import { getAllFiles, analyzeDirectoryStructure } from '../utils/fsUtils';
import { MultiModelAIService } from '../../lib/ai/multi-model-service';
import type { FileSystemNode, AIRequest } from '../types';

export interface CodebaseAnalysis {
  summary: string;
  technologies: string[];
  patterns: string[];
  structure: string;
  dependencies: string[];
  suggestions: string[];
  complexity: 'simple' | 'moderate' | 'complex';
  readiness: number; // 0-100 score
}

export interface DevelopmentPlan {
  requirements: string[];
  steps: DevelopmentStep[];
  timeline: string;
  complexity: 'simple' | 'moderate' | 'complex';
  estimatedFiles: string[];
  dependencies: string[];
}

export interface DevelopmentStep {
  id: string;
  title: string;
  description: string;
  type: 'analysis' | 'planning' | 'coding' | 'testing' | 'deployment';
  files: string[];
  content?: Record<string, string>; // filepath -> content
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  duration: string;
}

export interface AutonomousRequest {
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  context?: {
    files?: string[];
    existingFeatures?: string[];
    constraints?: string[];
  };
}

class AutonomousAIAgent {
  private aiService: MultiModelAIService;
  private isWorking: boolean = false;
  private currentTask: string | null = null;
  
  constructor() {
    this.aiService = new MultiModelAIService();
  }

  /**
   * 🧠 PHASE 1: Deep Codebase Analysis
   * Reads and understands the entire codebase structure
   */
  async analyzeCodebase(fs: FileSystemNode, rootPath: string = '/'): Promise<CodebaseAnalysis> {
    console.log('🔍 Starting deep codebase analysis...');
    
    const allFiles = getAllFiles(fs, rootPath);
    const structure = analyzeDirectoryStructure(fs);
    
    // Get key files for analysis
    const keyFiles = allFiles.filter(file => {
      const ext = file.path.split('.').pop()?.toLowerCase();
      return ['ts', 'tsx', 'js', 'jsx', 'json', 'md', 'yml', 'yaml'].includes(ext || '');
    });

    const analysisRequest: AIRequest = {
      model: 'claude-3.5-sonnet', // Best for code analysis
      messages: [
        {
          role: 'system',
          content: `You are a senior software architect and code analyst. Analyze this codebase deeply and provide comprehensive insights.

ANALYSIS REQUIREMENTS:
1. Identify the main technology stack and frameworks
2. Understand the project structure and patterns
3. Assess code quality and architecture
4. Identify dependencies and their purposes  
5. Suggest improvements and optimizations
6. Rate overall complexity and readiness

Respond in JSON format with the CodebaseAnalysis interface.`
        },
        {
          role: 'user',
          content: `Analyze this codebase:

DIRECTORY STRUCTURE:
${structure}

KEY FILES CONTENT:
${keyFiles.slice(0, 10).map((f: {path: string; content: string}) => `=== ${f.path} ===\n${f.content.slice(0, 2000)}${f.content.length > 2000 ? '\n...[truncated]' : ''}`).join('\n\n')}

Total files: ${allFiles.length}
Key technologies detected: ${this.detectTechnologies(allFiles)}

Provide a comprehensive analysis.`
        }
      ],
      temperature: 0.1,
      maxTokens: 4000
    };

    try {
      const response = await this.aiService.complete(analysisRequest);
      const analysis = JSON.parse(response.content) as CodebaseAnalysis;
      
      console.log('✅ Codebase analysis completed:', {
        complexity: analysis.complexity,
        readiness: analysis.readiness,
        technologies: analysis.technologies.length
      });
      
      return analysis;
    } catch (error) {
      console.error('❌ Codebase analysis failed:', error);
      
      // Fallback analysis
      return {
        summary: 'Basic codebase detected',
        technologies: this.detectTechnologies(allFiles),
        patterns: ['React Components', 'TypeScript'],
        structure: structure,
        dependencies: this.extractDependencies(allFiles),
        suggestions: ['Add more comprehensive testing', 'Improve documentation'],
        complexity: 'moderate',
        readiness: 70
      };
    }
  }

  /**
   * 🎯 PHASE 2: Intelligent Development Planning
   * Creates a step-by-step plan to implement the requested feature
   */
  async createDevelopmentPlan(
    analysis: CodebaseAnalysis, 
    request: AutonomousRequest
  ): Promise<DevelopmentPlan> {
    console.log('📋 Creating development plan for:', request.description);

    const planningRequest: AIRequest = {
      model: 'gpt-4o', // Best for strategic planning
      messages: [
        {
          role: 'system',
          content: `You are a senior software architect and project planner. Create a detailed, step-by-step development plan.

PLANNING REQUIREMENTS:
1. Break down the request into logical development steps
2. Identify all files that need to be created or modified
3. Consider existing codebase patterns and structure
4. Estimate timeline and complexity
5. Account for testing and integration
6. Follow best practices for the identified technology stack

Respond in JSON format with the DevelopmentPlan interface.`
        },
        {
          role: 'user',
          content: `Create a development plan:

USER REQUEST: "${request.description}"
PRIORITY: ${request.priority}

CODEBASE ANALYSIS:
- Technologies: ${analysis.technologies.join(', ')}
- Complexity: ${analysis.complexity}
- Readiness: ${analysis.readiness}%
- Current Structure: ${analysis.structure}

CONTEXT:
${request.context ? JSON.stringify(request.context, null, 2) : 'No additional context'}

Create a comprehensive, actionable plan.`
        },
      ],
      temperature: 0.2,
      maxTokens: 4000
    };

    try {
      const response = await this.aiService.complete(planningRequest);
      const plan = JSON.parse(response.content) as DevelopmentPlan;
      
      console.log('✅ Development plan created:', {
        steps: plan.steps.length,
        complexity: plan.complexity,
        estimatedFiles: plan.estimatedFiles.length
      });
      
      return plan;
    } catch (error) {
      console.error('❌ Development planning failed:', error);
      throw new Error(`Failed to create development plan: ${error}`);
    }
  }

  /**
   * 🚀 PHASE 3: Autonomous Feature Implementation
   * Actually builds the complete feature
   */
  async implementFeature(
    plan: DevelopmentPlan,
    fs: FileSystemNode,
    onProgress?: (step: DevelopmentStep, progress: number) => void,
    onFileGenerated?: (path: string, content: string) => void
  ): Promise<Record<string, string>> {
    console.log('🛠️ Starting autonomous feature implementation...');
    
    this.isWorking = true;
    this.currentTask = plan.steps[0]?.title || 'Implementation';
    
    const generatedFiles: Record<string, string> = {};
    
    try {
      for (let i = 0; i < plan.steps.length; i++) {
        const step = plan.steps[i];
        console.log(`🔧 Executing step ${i + 1}/${plan.steps.length}: ${step.title}`);
        
        step.status = 'in-progress';
        onProgress?.(step, (i / plan.steps.length) * 100);
        
        if (step.type === 'coding') {
          const stepFiles = await this.implementStep(step, fs, generatedFiles);
          Object.assign(generatedFiles, stepFiles);
          
          // Notify about each generated file
          Object.entries(stepFiles).forEach(([path, content]) => {
            onFileGenerated?.(path, content);
          });
        }
        
        step.status = 'completed';
        
        // Small delay to prevent overwhelming the AI APIs
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log('✅ Feature implementation completed!', {
        filesGenerated: Object.keys(generatedFiles).length
      });
      
      return generatedFiles;
      
    } catch (error) {
      console.error('❌ Feature implementation failed:', error);
      throw new Error(`Implementation failed: ${error}`);
    } finally {
      this.isWorking = false;
      this.currentTask = null;
    }
  }

  /**
   * 🔨 PHASE 4: Individual Step Implementation
   * Implements a single development step
   */
  private async implementStep(
    step: DevelopmentStep,
    fs: FileSystemNode,
    existingFiles: Record<string, string>
  ): Promise<Record<string, string>> {
    const implementationRequest: AIRequest = {
      model: 'claude-3.5-sonnet', // Best for code generation
      messages: [
        {
          role: 'system',
          content: `You are an expert software developer. Implement the requested step with high-quality, production-ready code.

IMPLEMENTATION REQUIREMENTS:
1. Follow existing codebase patterns and conventions
2. Write clean, maintainable, well-commented code
3. Include proper TypeScript types and interfaces
4. Follow React/Next.js best practices
5. Ensure responsive design and accessibility
6. Include error handling and edge cases
7. Generate complete, working files

Respond with a JSON object where keys are file paths and values are complete file contents.`
        },
        {
          role: 'user',
          content: `Implement this development step:

STEP: ${step.title}
DESCRIPTION: ${step.description}
FILES TO CREATE/MODIFY: ${step.files.join(', ')}

EXISTING FILES CONTEXT:
${Object.entries(existingFiles).map(([path, content]) => 
  `=== ${path} ===\n${content.slice(0, 1000)}${content.length > 1000 ? '\n...[truncated]' : ''}`
).join('\n\n')}

CURRENT CODEBASE STRUCTURE:
${this.getRelevantContext(fs, step.files)}

Generate complete, production-ready code for all required files.`
        }
      ],
      temperature: 0.1,
      maxTokens: 6000
    };

    try {
      const response = await this.aiService.complete(implementationRequest);
      const files = JSON.parse(response.content) as Record<string, string>;
      
      console.log(`✅ Step implemented: ${step.title}`, {
        filesGenerated: Object.keys(files).length
      });
      
      return files;
    } catch (error) {
      console.error(`❌ Step implementation failed: ${step.title}`, error);
      return {};
    }
  }

  /**
   * 🎛️ Control Methods
   */
  public getStatus() {
    return {
      isWorking: this.isWorking,
      currentTask: this.currentTask
    };
  }

  public stop() {
    this.isWorking = false;
    this.currentTask = null;
    console.log('🛑 Autonomous agent stopped');
  }

  /**
   * 🔧 Helper Methods
   */
  private detectTechnologies(files: Array<{path: string; content: string}>): string[] {
    const technologies: Set<string> = new Set();
    
    files.forEach(file => {
      const content = file.content.toLowerCase();
      const path = file.path.toLowerCase();
      
      // Framework detection
      if (content.includes('react') || path.includes('.tsx') || path.includes('.jsx')) {
        technologies.add('React');
      }
      if (content.includes('next') || content.includes('next.js')) {
        technologies.add('Next.js');
      }
      if (content.includes('typescript') || path.includes('.ts') || path.includes('.tsx')) {
        technologies.add('TypeScript');
      }
      if (content.includes('tailwind') || content.includes('tailwindcss')) {
        technologies.add('Tailwind CSS');
      }
      if (content.includes('vite')) {
        technologies.add('Vite');
      }
      if (content.includes('zustand')) {
        technologies.add('Zustand');
      }
      if (content.includes('monaco-editor')) {
        technologies.add('Monaco Editor');
      }
      if (content.includes('webcontainer')) {
        technologies.add('WebContainer');
      }
    });
    
    return Array.from(technologies);
  }

  private extractDependencies(files: Array<{path: string; content: string}>): string[] {
    const dependencies: Set<string> = new Set();
    
    const packageJsonFile = files.find(f => f.path.includes('package.json'));
    if (packageJsonFile) {
      try {
        const pkg = JSON.parse(packageJsonFile.content);
        Object.keys(pkg.dependencies || {}).forEach(dep => dependencies.add(dep));
        Object.keys(pkg.devDependencies || {}).forEach(dep => dependencies.add(dep));
      } catch (error) {
        console.warn('Failed to parse package.json:', error);
      }
    }
    
    return Array.from(dependencies);
  }

  private getRelevantContext(fs: FileSystemNode, targetFiles: string[]): string {
    // Get context from similar/related files
    const allFiles = getAllFiles(fs, '/');
    const contextFiles = allFiles.filter(file => {
      const isRelevant = targetFiles.some(target => {
        const targetDir = target.split('/').slice(0, -1).join('/');
        const fileDir = file.path.split('/').slice(0, -1).join('/');
        return fileDir === targetDir || file.path.includes(targetDir);
      });
      return isRelevant;
    });

    return contextFiles.slice(0, 5).map((f: {path: string; content: string}) =>
      `=== ${f.path} ===\n${f.content.slice(0, 500)}${f.content.length > 500 ? '...' : ''}`
    ).join('\n\n');
  }
}

// Export singleton instance
export const autonomousAgent = new AutonomousAIAgent();

// Main autonomous development function
export async function buildFeatureAutonomously(
  request: AutonomousRequest,
  fs: FileSystemNode,
  onProgress?: (phase: string, progress: number, details?: any) => void,
  onFileGenerated?: (path: string, content: string) => void
): Promise<Record<string, string>> {
  console.log('🚀 STARTING AUTONOMOUS DEVELOPMENT PROCESS');
  console.log('Request:', request.description);
  
  try {
    // Phase 1: Analyze codebase
    onProgress?.('Analyzing codebase...', 10);
    const analysis = await autonomousAgent.analyzeCodebase(fs);
    
    // Phase 2: Create development plan
    onProgress?.('Creating development plan...', 30, { analysis });
    const plan = await autonomousAgent.createDevelopmentPlan(analysis, request);
    
    // Phase 3: Implement feature
    onProgress?.('Implementing feature...', 50, { plan });
    const files = await autonomousAgent.implementFeature(
      plan, 
      fs, 
      (step, progress) => onProgress?.(`Implementing: ${step.title}`, 50 + (progress * 0.4)),
      onFileGenerated
    );
    
    onProgress?.('Feature completed!', 100, { files: Object.keys(files) });
    
    console.log('✅ AUTONOMOUS DEVELOPMENT COMPLETED!');
    return files;
    
  } catch (error) {
    console.error('❌ AUTONOMOUS DEVELOPMENT FAILED:', error);
    throw error;
  }
}