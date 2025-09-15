// 🚀 AUTONOMOUS AI DEVELOPMENT PANEL
// The revolutionary UI that shows AI building features in real-time

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  buildFeatureAutonomously, 
  autonomousAgent, 
  type AutonomousRequest, 
  type CodebaseAnalysis, 
  type DevelopmentPlan,
  type DevelopmentStep 
} from '../services/autonomousAgent';
import { useFileSystem } from '../hooks/useFileSystem';
import { useNotifications } from '../hooks/useNotifications';
import { Icons } from './Icon';

interface AutonomousDevelopmentPanelProps {
  isVisible: boolean;
  onToggle: () => void;
  onFileGenerated?: (path: string, content: string) => void;
}

interface ProgressUpdate {
  phase: string;
  progress: number;
  details?: any;
}

const AutonomousDevelopmentPanel: React.FC<AutonomousDevelopmentPanelProps> = ({
  isVisible,
  onToggle,
  onFileGenerated
}) => {
  const { fs, createNode } = useFileSystem();
  const { addNotification } = useNotifications();
  
  // State
  const [isWorking, setIsWorking] = useState(false);
  const [currentProgress, setCurrentProgress] = useState<ProgressUpdate>({ phase: '', progress: 0 });
  const [analysis, setAnalysis] = useState<CodebaseAnalysis | null>(null);
  const [plan, setPlan] = useState<DevelopmentPlan | null>(null);
  const [generatedFiles, setGeneratedFiles] = useState<string[]>([]);
  const [request, setRequest] = useState<string>('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  
  // Form state
  const [step, setStep] = useState<'input' | 'analysis' | 'planning' | 'implementation' | 'completed'>('input');

  const handleSubmit = useCallback(async () => {
    if (!request.trim() || !fs) {
      addNotification({ type: 'error', message: 'Please provide a feature description' });
      return;
    }

    setIsWorking(true);
    setStep('analysis');
    setGeneratedFiles([]);
    
    const autonomousRequest: AutonomousRequest = {
      description: request.trim(),
      priority,
      context: {
        existingFeatures: [],
        constraints: ['Follow existing code patterns', 'Use TypeScript', 'Ensure responsive design']
      }
    };

    try {
      addNotification({ type: 'info', message: '🚀 Starting autonomous development...' });
      
      const files = await buildFeatureAutonomously(
        autonomousRequest,
        fs,
        (phase, progress, details) => {
          setCurrentProgress({ phase, progress, details });
          
          // Update UI step based on progress
          if (progress < 30) setStep('analysis');
          else if (progress < 50) setStep('planning');
          else if (progress < 100) setStep('implementation');
          else setStep('completed');
          
          // Store analysis and plan from details
          if (details?.analysis) setAnalysis(details.analysis);
          if (details?.plan) setPlan(details.plan);
        },
        async (path, content) => {
          // Auto-create generated files
          try {
            await createNode(path, 'file', content);
            setGeneratedFiles(prev => [...prev, path]);
            onFileGenerated?.(path, content);
            addNotification({ 
              type: 'success', 
              message: `✨ Generated: ${path.split('/').pop()}` 
            });
          } catch (error) {
            console.warn('Failed to create file:', path, error);
          }
        }
      );

      addNotification({ 
        type: 'success', 
        message: `🎉 Feature completed! Generated ${Object.keys(files).length} files` 
      });
      
    } catch (error) {
      console.error('Autonomous development failed:', error);
      addNotification({ 
        type: 'error', 
        message: `❌ Development failed: ${error}` 
      });
      setStep('input');
    } finally {
      setIsWorking(false);
    }
  }, [request, priority, fs, createNode, addNotification, onFileGenerated]);

  const handleStop = useCallback(() => {
    autonomousAgent.stop();
    setIsWorking(false);
    setStep('input');
    addNotification({ type: 'info', message: '🛑 Development stopped' });
  }, [addNotification]);

  const handleReset = useCallback(() => {
    setStep('input');
    setRequest('');
    setCurrentProgress({ phase: '', progress: 0 });
    setAnalysis(null);
    setPlan(null);
    setGeneratedFiles([]);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="h-full flex flex-col bg-black/40 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <Icons.Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Autonomous AI Developer</h3>
            <p className="text-xs text-gray-400">Build complete features with AI</p>
          </div>
        </div>
        <button
          onClick={onToggle}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <Icons.X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {step === 'input' && <InputStep 
            request={request}
            setRequest={setRequest}
            priority={priority}
            setPriority={setPriority}
            onSubmit={handleSubmit}
            isWorking={isWorking}
          />}
          
          {(step === 'analysis' || step === 'planning' || step === 'implementation') && (
            <ProgressStep
              progress={currentProgress}
              analysis={analysis}
              plan={plan}
              generatedFiles={generatedFiles}
              onStop={handleStop}
              isWorking={isWorking}
            />
          )}
          
          {step === 'completed' && (
            <CompletedStep
              generatedFiles={generatedFiles}
              analysis={analysis}
              plan={plan}
              onReset={handleReset}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Input Step Component
const InputStep: React.FC<{
  request: string;
  setRequest: (value: string) => void;
  priority: 'low' | 'medium' | 'high' | 'critical';
  setPriority: (value: 'low' | 'medium' | 'high' | 'critical') => void;
  onSubmit: () => void;
  isWorking: boolean;
}> = ({ request, setRequest, priority, setPriority, onSubmit, isWorking }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="p-6 space-y-6"
  >
    <div>
      <h4 className="text-lg font-semibold text-white mb-2">Describe Your Feature</h4>
      <p className="text-sm text-gray-400 mb-4">
        Tell the AI what you want to build. Be specific about functionality, design, and requirements.
      </p>
      
      <textarea
        value={request}
        onChange={(e) => setRequest(e.target.value)}
        placeholder="Example: Create a user dashboard with profile editing, activity feed, and notification settings. Use responsive design with dark theme support."
        className="w-full h-32 p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 resize-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        disabled={isWorking}
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value as any)}
        className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        disabled={isWorking}
      >
        <option value="low">Low - Simple addition</option>
        <option value="medium">Medium - Standard feature</option>
        <option value="high">High - Complex feature</option>
        <option value="critical">Critical - Core functionality</option>
      </select>
    </div>

    <div className="space-y-3">
      <h5 className="text-sm font-medium text-gray-300">AI Capabilities:</h5>
      <div className="grid grid-cols-1 gap-2 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <Icons.Check className="w-3 h-3 text-green-400" />
          <span>Analyzes entire codebase structure</span>
        </div>
        <div className="flex items-center gap-2">
          <Icons.Check className="w-3 h-3 text-green-400" />
          <span>Creates detailed development plan</span>
        </div>
        <div className="flex items-center gap-2">
          <Icons.Check className="w-3 h-3 text-green-400" />
          <span>Generates production-ready code</span>
        </div>
        <div className="flex items-center gap-2">
          <Icons.Check className="w-3 h-3 text-green-400" />
          <span>Follows existing patterns and conventions</span>
        </div>
        <div className="flex items-center gap-2">
          <Icons.Check className="w-3 h-3 text-green-400" />
          <span>Includes TypeScript types and error handling</span>
        </div>
      </div>
    </div>

    <button
      onClick={onSubmit}
      disabled={!request.trim() || isWorking}
      className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
    >
      {isWorking ? 'Starting Development...' : '🚀 Build Feature Autonomously'}
    </button>
  </motion.div>
);

// Progress Step Component
const ProgressStep: React.FC<{
  progress: ProgressUpdate;
  analysis: CodebaseAnalysis | null;
  plan: DevelopmentPlan | null;
  generatedFiles: string[];
  onStop: () => void;
  isWorking: boolean;
}> = ({ progress, analysis, plan, generatedFiles, onStop, isWorking }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="p-6 space-y-6"
  >
    {/* Progress Bar */}
    <div>
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-lg font-semibold text-white">{progress.phase}</h4>
        <span className="text-sm text-gray-400">{Math.round(progress.progress)}%</span>
      </div>
      <div className="w-full bg-white/10 rounded-full h-2">
        <motion.div
          className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress.progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>

    {/* Analysis Results */}
    {analysis && (
      <div className="bg-white/5 rounded-lg p-4">
        <h5 className="font-medium text-white mb-2">📊 Codebase Analysis</h5>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Complexity:</span>
            <span className={`ml-2 ${
              analysis.complexity === 'simple' ? 'text-green-400' :
              analysis.complexity === 'moderate' ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {analysis.complexity}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Readiness:</span>
            <span className="ml-2 text-blue-400">{analysis.readiness}%</span>
          </div>
        </div>
        <div className="mt-2">
          <span className="text-gray-400">Technologies:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {analysis.technologies.slice(0, 6).map(tech => (
              <span key={tech} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>
    )}

    {/* Development Plan */}
    {plan && (
      <div className="bg-white/5 rounded-lg p-4">
        <h5 className="font-medium text-white mb-2">📋 Development Plan</h5>
        <div className="space-y-2">
          {plan.steps.slice(0, 5).map((step, index) => (
            <div key={step.id} className="flex items-center gap-3 text-sm">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                step.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                step.status === 'in-progress' ? 'bg-blue-500/20 text-blue-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>
                {step.status === 'completed' ? '✓' : index + 1}
              </div>
              <span className="text-gray-300">{step.title}</span>
            </div>
          ))}
          {plan.steps.length > 5 && (
            <div className="text-xs text-gray-500 ml-9">
              +{plan.steps.length - 5} more steps...
            </div>
          )}
        </div>
      </div>
    )}

    {/* Generated Files */}
    {generatedFiles.length > 0 && (
      <div className="bg-white/5 rounded-lg p-4">
        <h5 className="font-medium text-white mb-2">📁 Generated Files ({generatedFiles.length})</h5>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {generatedFiles.map(file => (
            <div key={file} className="flex items-center gap-2 text-sm">
              <Icons.FileText className="w-3 h-3 text-green-400" />
              <span className="text-gray-300 font-mono">{file}</span>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Stop Button */}
    {isWorking && (
      <button
        onClick={onStop}
        className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
      >
        🛑 Stop Development
      </button>
    )}
  </motion.div>
);

// Completed Step Component
const CompletedStep: React.FC<{
  generatedFiles: string[];
  analysis: CodebaseAnalysis | null;
  plan: DevelopmentPlan | null;
  onReset: () => void;
}> = ({ generatedFiles, analysis, plan, onReset }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="p-6 space-y-6"
  >
    <div className="text-center">
      <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icons.Check className="w-8 h-8 text-white" />
      </div>
      <h4 className="text-xl font-semibold text-white mb-2">🎉 Feature Completed!</h4>
      <p className="text-gray-400">
        The AI has successfully analyzed your codebase and built the requested feature.
      </p>
    </div>

    <div className="bg-white/5 rounded-lg p-4">
      <h5 className="font-medium text-white mb-3">📊 Summary</h5>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Files Generated:</span>
          <span className="text-green-400">{generatedFiles.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Development Steps:</span>
          <span className="text-blue-400">{plan?.steps.length || 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Codebase Readiness:</span>
          <span className="text-purple-400">{analysis?.readiness || 0}%</span>
        </div>
      </div>
    </div>

    <div className="space-y-3">
      <h5 className="font-medium text-white">✨ What's Next?</h5>
      <div className="space-y-2 text-sm text-gray-400">
        <div className="flex items-center gap-2">
          <Icons.Check className="w-3 h-3 text-green-400" />
          <span>Review the generated files in your file explorer</span>
        </div>
        <div className="flex items-center gap-2">
          <Icons.Check className="w-3 h-3 text-green-400" />
          <span>Test the new functionality</span>
        </div>
        <div className="flex items-center gap-2">
          <Icons.Check className="w-3 h-3 text-green-400" />
          <span>Make any necessary adjustments</span>
        </div>
        <div className="flex items-center gap-2">
          <Icons.Check className="w-3 h-3 text-green-400" />
          <span>Deploy your updated application</span>
        </div>
      </div>
    </div>

    <button
      onClick={onReset}
      className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
    >
      🚀 Build Another Feature
    </button>
  </motion.div>
);

export default AutonomousDevelopmentPanel;