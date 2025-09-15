import React, { useState, useEffect } from 'react';
import { useProjectInitializer } from '../hooks/useProjectInitializer';
import { ProjectType } from '../services/projectInitializer';
import { Icons } from './Icon';

interface ProjectInitializerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProjectInitializerModal: React.FC<ProjectInitializerModalProps> = ({ isOpen, onClose }) => {
  const {
    detectProjectType,
    initializeProject,
    getAvailableProjectTypes,
    isInitializing,
    detectedConfig
  } = useProjectInitializer();

  const [selectedType, setSelectedType] = useState<ProjectType | null>(null);
  const [availableTypes] = useState<ProjectType[]>(getAvailableProjectTypes());

  useEffect(() => {
    if (isOpen) {
      detectProjectType();
    }
  }, [isOpen, detectProjectType]);

  const handleInitialize = async () => {
    if (!selectedType) return;

    await initializeProject(selectedType);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Initialize Project</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <Icons.X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Detected Project */}
          {detectedConfig && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Icons.Info className="w-5 h-5 text-green-600" />
                <h3 className="font-medium text-green-800">Project Detected</h3>
              </div>
              <p className="text-green-700">
                Detected <strong>{detectedConfig.type.name}</strong> project
              </p>
              <div className="mt-2 text-sm text-green-600">
                <p>Framework: {detectedConfig.type.framework}</p>
                <p>Language: {detectedConfig.type.language}</p>
                <p>Build Tool: {detectedConfig.type.buildTool}</p>
              </div>
            </div>
          )}

          {/* Project Type Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {detectedConfig ? 'Or choose a different project type:' : 'Choose a project type:'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableTypes.map((type) => (
                <div
                  key={type.name}
                  onClick={() => setSelectedType(type)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedType?.name === type.name
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icons.File className="w-5 h-5 text-gray-600" />
                    <h4 className="font-medium text-gray-900">{type.name}</h4>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Framework: {type.framework}</p>
                    <p>Language: {type.language}</p>
                    <p>Port: {type.port}</p>
                  </div>
                  {type.dependencies.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      Dependencies: {type.dependencies.slice(0, 3).join(', ')}
                      {type.dependencies.length > 3 && '...'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Actions */}
          {detectedConfig && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recommended Actions:</h3>
              <ul className="space-y-2">
                {detectedConfig.recommendedActions.map((action, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-gray-700">
                    <Icons.Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={isInitializing}
            >
              Cancel
            </button>
            <button
              onClick={handleInitialize}
              disabled={!selectedType || isInitializing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isInitializing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Initializing...
                </>
              ) : (
                <>
                  <Icons.Play className="w-4 h-4" />
                  Initialize Project
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectInitializerModal;