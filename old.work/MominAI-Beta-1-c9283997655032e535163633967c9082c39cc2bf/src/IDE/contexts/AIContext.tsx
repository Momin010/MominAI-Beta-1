
import React, { createContext, useContext, useState, useCallback, ReactNode, useRef, useEffect } from 'react';
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
    const abortControllerRef = useRef<AbortController | null>(null);
    const [internetAccessEnabled, setInternetAccessEnabled] = useState(() => {
        return internetAccessService.isInternetAccessEnabled();
    });
    const { addNotification } = useNotifications();

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const sendMessage = useCallback(async (prompt: string) => {
        if (isLoading || !fs) return;

        // Cancel any existing request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Create new abort controller for this request
        abortControllerRef.current = new AbortController();

        setIsLoading(true);

        try {
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

            // Check for abort signal
            for await (const chunk of stream) {
                if (abortControllerRef.current?.signal.aborted) {
                    console.log('AI request was cancelled');
                    return;
                }

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

        } catch (error) {
            console.error("Error in AI conversation:", error);

            // Handle different types of errors
            let errorMessage = 'An unexpected error occurred while processing your request.';
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    errorMessage = 'Request was cancelled.';
                } else if (error.message.includes('500')) {
                    errorMessage = 'AI service is temporarily unavailable. Please try again later.';
                } else if (error.message.includes('429')) {
                    errorMessage = 'Too many requests. Please wait a moment before trying again.';
                } else if (error.message.includes('401')) {
                    errorMessage = 'Authentication failed. Please check your API key.';
                } else {
                    errorMessage = error.message;
                }
            }

            // Update the last AI message with error
            setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage && lastMessage.sender === 'ai') {
                    lastMessage.text = `❌ Error: ${errorMessage}`;
                    lastMessage.isStreaming = false;
                }
                return newMessages;
            });

            addNotification({ type: 'error', message: errorMessage });
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }

    }, [isLoading, fs, addNotification]);

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

    const applyChanges = useCallback(async (messageIndex: number, actions: FileAction[]) => {
        const message = messages[messageIndex];
        if (!message) {
            addNotification({ type: 'error', message: "Could not find message to apply changes." });
            return;
        }

        try {
            // Apply each action in real-time
            for (const action of actions) {
                if (action.action === 'create') {
                    if (action.type === 'directory') {
                        await createNode(action.path, 'directory');
                        addNotification({ type: 'info', message: `Created directory: ${action.path}` });
                    } else if (action.type === 'file') {
                        await createNode(action.path, 'file', action.content || '');
                        addNotification({ type: 'info', message: `Created file: ${action.path}` });
                    }
                } else if (action.action === 'update') {
                    await updateNode(action.path, action.content || '');
                    addNotification({ type: 'info', message: `Updated file: ${action.path}` });
                }
            }

            // Mark actions as applied
            setMessages(prev => {
                const newMessages = [...prev];
                if (newMessages[messageIndex]) {
                    newMessages[messageIndex].actionsApplied = true;
                }
                return newMessages;
            });

            // Only refresh preview if we actually made changes that affect the preview
            const hasRelevantChanges = actions.some(action =>
                action.path.endsWith('.html') ||
                action.path.endsWith('.jsx') ||
                action.path.endsWith('.tsx') ||
                action.path.endsWith('.vue') ||
                action.path === '/src/App.jsx' ||
                action.path === '/index.html'
            );

            if (hasRelevantChanges && refreshPreview) {
                // Use a small delay to allow file system to update
                setTimeout(() => {
                    refreshPreview();
                }, 500);
            }

            addNotification({ type: 'success', message: `Successfully applied ${actions.length} change(s)!` });
        } catch (error) {
            console.error("Error applying changes:", error);
            addNotification({
                type: 'error',
                message: `Failed to apply changes: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        }
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
