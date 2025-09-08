
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { Message, EditorAIAction, FileAction, FileSystemNode } from '../types';
import { streamAIResponse } from '../services/aiService';
import { useNotifications } from '../App';
import { getAllFiles } from '../utils/fsUtils';
import { internetAccessService, type CompanyInfo } from '../services/internetAccessService';

interface AIContextType {
    messages: Message[];
    isLoading: boolean;
    sendMessage: (prompt: string) => Promise<void>;
    performEditorAction: (action: EditorAIAction, code: string, filePath: string) => Promise<void>;
    applyChanges: (messageIndex: number, actions: FileAction[]) => void;
    createNode: (path: string, type: 'file' | 'directory', content?: string) => void;
    updateNode: (path: string, content: string) => void;
    getNode: (path: string) => FileSystemNode | null;
    openFile: (path: string, line?: number) => void;
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    refreshPreview?: () => void;
    // Internet access features (safely removable)
    internetAccessEnabled: boolean;
    toggleInternetAccess: () => void;
    scanIndustryWebsites: (industry: string) => Promise<any[]>;
    takeWebsiteScreenshot: (url: string) => Promise<string>;
    convertScreenshotToCode: (imageData: string, description: string) => Promise<string>;
    searchStockImages: (query: string, limit?: number) => Promise<any[]>;
    searchSketchfabModels: (query: string, limit?: number) => Promise<any[]>;
    generate3DHeroSection: (model: any, backgroundColor?: string) => Promise<string>;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export const useAI = () => {
    const context = useContext(AIContext);
    if (!context) {
        throw new Error('useAI must be used within an AIProvider');
    }
    return context;
};

interface AIProviderProps {
    children: ReactNode;
    activeFile: string | null;
    getOpenFileContent: () => string;
    createNode: (path: string, type: 'file' | 'directory', content?: string) => void;
    updateNode: (path: string, content: string) => void;
    getNode: (path: string) => FileSystemNode | null;
    openFile: (path: string, line?: number) => void;
    fs: FileSystemNode | null;
    setDiffModalState: (state: { isOpen: boolean, actions: FileAction[], originalFiles: { path: string, content: string }[], messageIndex?: number }) => void;
    refreshPreview?: () => void;
}

export const AIProvider: React.FC<AIProviderProps> = ({ children, activeFile, getOpenFileContent, createNode, updateNode, getNode, openFile, fs, setDiffModalState, refreshPreview }) => {
    const [messages, setMessages] = useState<Message[]>([
        { sender: 'ai', text: "Hello! I'm your AI assistant. I have full context of your project and can help with multi-file changes. Ask away!" }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [internetAccessEnabled, setInternetAccessEnabled] = useState(() => {
        return internetAccessService.isInternetAccessEnabled();
    });
    const { addNotification } = useNotifications();

    const sendMessage = useCallback(async (prompt: string) => {
        if (isLoading || !fs) return;
        setIsLoading(true);

        const allFiles = getAllFiles(fs, '/');
        const projectContext = allFiles.length > 0
            ? `\n\nHere is the full project structure and content for context:\n` + allFiles.map(f => `--- FILE: ${f.path} ---\n${f.content}`).join('\n\n')
            : '';
        
        const fullPrompt = `${prompt}${projectContext}`;
        
        const userMessage: Message = { sender: 'user', text: prompt };
        // Store the original contents of the files the AI might change
        userMessage.originalFileContents = allFiles;

        const aiMessagePlaceholder: Message = { sender: 'ai', text: '', isStreaming: true };
        setMessages(prev => [...prev, userMessage, aiMessagePlaceholder]);
        
        let fullResponse = '';
        const stream = streamAIResponse(fullPrompt);

        for await (const chunk of stream) {
            fullResponse += chunk;
            setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage && lastMessage.sender === 'ai') {
                    lastMessage.text = fullResponse;
                }
                return newMessages;
            });
        }

        // Stream finished, now process the full response
        let finalAiMessage: Message = { sender: 'ai', text: fullResponse, isStreaming: false };
        const jsonStart = fullResponse.indexOf('{');
        const jsonEnd = fullResponse.lastIndexOf('}');

        if (jsonStart !== -1 && jsonEnd > jsonStart) {
            const jsonString = fullResponse.substring(jsonStart, jsonEnd + 1);
            try {
                const parsed = JSON.parse(jsonString);
                if (parsed.explanation && parsed.actions && Array.isArray(parsed.actions)) {
                    finalAiMessage = {
                        sender: 'ai',
                        text: parsed.explanation,
                        actions: parsed.actions,
                        actionsApplied: false,
                        originalFileContents: allFiles,
                    };
                }
            } catch (e) {
                // It wasn't a valid JSON action object, so we'll just treat it as a text response.
                console.warn("AI response contained JSON-like characters but failed to parse:", e);
            }
        }
        
        setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = finalAiMessage;
            return newMessages;
        });

        setIsLoading(false);

    }, [isLoading, fs]);

    const processStream = useCallback(async (userMessage: Message, stream: AsyncGenerator<string>) => {
        if (isLoading) return;
        setIsLoading(true);
        
        setMessages(prev => [...prev, userMessage, { sender: 'ai', text: '', isStreaming: true }]);
        
        let fullResponse = '';
        
        for await (const chunk of stream) {
            fullResponse += chunk;
            setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if(lastMessage && lastMessage.sender === 'ai') {
                    lastMessage.text = fullResponse;
                }
                return newMessages;
            });
        }
        
        setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if(lastMessage && lastMessage.sender === 'ai') {
                lastMessage.isStreaming = false;
            }
            return newMessages;
        });
        setIsLoading(false);
    }, [isLoading]);

    const performEditorAction = useCallback(async (action: EditorAIAction, code: string, filePath: string) => {
        let prompt = '';
        let userMessageText = '';

        switch (action) {
            case 'explain':
                prompt = `Explain the following code snippet from the file \`${filePath}\`:\n\n\`\`\`\n${code}\n\`\`\``;
                userMessageText = `Explain selection from \`${filePath}\``;
                break;
            case 'refactor':
                prompt = `Refactor the following code snippet from \`${filePath}\` for improved readability, performance, and best practices. Provide the refactored code and a brief explanation of the changes:\n\n\`\`\`\n${code}\n\`\`\``;
                userMessageText = `Refactor selection from \`${filePath}\``;
                break;
            case 'find_bugs':
                prompt = `Analyze the following code snippet from \`${filePath}\` for potential bugs, errors, or logical issues. If you find any, explain them and suggest a fix:\n\n\`\`\`\n${code}\n\`\`\``;
                userMessageText = `Find bugs in selection from \`${filePath}\``;
                break;
        }

        const userMessage: Message = { sender: 'user', text: userMessageText };
        const stream = streamAIResponse(prompt);
        await processStream(userMessage, stream);

    }, [processStream]);

    const applyChanges = useCallback((messageIndex: number, actions: FileAction[]) => {
        const message = messages[messageIndex];
        if (!message) {
            addNotification({ type: 'error', message: "Could not find message to apply changes." });
            return;
        }

        // Apply each action
        actions.forEach(action => {
            if (action.action === 'create') {
                if (action.type === 'directory') {
                    createNode(action.path, 'directory');
                } else if (action.type === 'file') {
                    createNode(action.path, 'file', action.content || '');
                }
            } else if (action.action === 'update') {
                updateNode(action.path, action.content || '');
            }
        });

        // Mark actions as applied
        setMessages(prev => {
            const newMessages = [...prev];
            if (newMessages[messageIndex]) {
                newMessages[messageIndex].actionsApplied = true;
            }
            return newMessages;
        });

        // Refresh preview after AI changes
        if (refreshPreview) {
            refreshPreview();
        }

        addNotification({ type: 'success', message: "Changes applied successfully." });
    }, [messages, addNotification, createNode, updateNode, setMessages, refreshPreview]);

    // Internet access features (safely removable)
    const toggleInternetAccess = useCallback(() => {
        const newValue = !internetAccessEnabled;
        setInternetAccessEnabled(newValue);
        internetAccessService.setEnabled(newValue);
        addNotification({
            type: newValue ? 'success' : 'info',
            message: `Internet access ${newValue ? 'enabled' : 'disabled'}`
        });
    }, [internetAccessEnabled, addNotification]);

    const scanIndustryWebsites = useCallback(async (industry: string): Promise<CompanyInfo[]> => {
        return await internetAccessService.scanIndustryWebsites(industry);
    }, []);

    const takeWebsiteScreenshot = useCallback(async (url: string): Promise<string> => {
        const result = await internetAccessService.takeWebsiteScreenshot(url);
        return result.imageData;
    }, []);

    const convertScreenshotToCode = useCallback(async (imageData: string, description: string): Promise<string> => {
        return await internetAccessService.convertScreenshotToCode(imageData, description);
    }, []);

    const searchStockImages = useCallback(async (query: string, limit: number = 10): Promise<any[]> => {
        return await internetAccessService.searchStockImages(query, limit);
    }, []);

    const searchSketchfabModels = useCallback(async (query: string, limit: number = 5): Promise<any[]> => {
        return await internetAccessService.searchSketchfabModels(query, limit);
    }, []);

    const generate3DHeroSection = useCallback(async (model: any, backgroundColor: string = '#ffffff'): Promise<string> => {
        return await internetAccessService.generate3DHeroSection(model, backgroundColor);
    }, []);

    const value = {
        messages,
        isLoading,
        sendMessage,
        performEditorAction,
        applyChanges,
        createNode,
        updateNode,
        getNode,
        openFile,
        setMessages,
        refreshPreview,
        // Internet access features
        internetAccessEnabled,
        toggleInternetAccess,
        scanIndustryWebsites,
        takeWebsiteScreenshot,
        convertScreenshotToCode,
        searchStockImages,
        searchSketchfabModels,
        generate3DHeroSection
    };

    return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
};
