
import React, { useState, useRef, useEffect } from 'react';
import { useAI } from '../contexts/AIContext';
import type { Message } from '../types';
import { Icons } from './Icon';

declare const marked: any;

const AIAssistant: React.FC = () => {
  const { messages, sendMessage, isLoading, applyChanges, internetAccessEnabled, toggleInternetAccess } = useAI();

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.sender === 'ai' && lastMessage.actions && !lastMessage.actionsApplied) {
      applyChanges(messages.length - 1, lastMessage.actions);
    }
  }, [messages, applyChanges]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSendMessage = async () => {
    const prompt = input;
    if (prompt.trim() === '' || isLoading) return;
    setInput('');
    await sendMessage(prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderMessage = (msg: Message) => {
      // Remove code blocks from the message text
      const cleanedText = msg.text.replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '');
      if (typeof marked === 'undefined') {
          return <p className="text-sm whitespace-pre-wrap">{cleanedText}</p>;
      }
      const rawHtml = marked.parse(cleanedText);
      return (
        <div className="prose prose-sm prose-invert max-w-none prose-p:my-2 prose-pre:my-2 prose-pre:bg-black/20 prose-pre:p-2 prose-pre:rounded-md">
            <span dangerouslySetInnerHTML={{ __html: rawHtml }} />
            {msg.isStreaming && (
              <span className="inline-flex items-center ml-2 space-x-1">
                <span className="w-1 h-1 bg-white rounded-full animate-bounce"></span>
                <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
              </span>
            )}
        </div>
      );
  };

  return (
    <div className="text-gray-200 h-full flex flex-col bg-transparent">
      {/* Internet Access Toggle */}
      <div className="p-3 border-b border-[var(--border-color)] bg-[var(--ui-panel-bg-heavy)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icons.ExternalLink className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium">Internet Access</span>
        </div>
        <button
          onClick={toggleInternetAccess}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            internetAccessEnabled ? 'bg-blue-600' : 'bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              internetAccessEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4 min-h-0">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-[var(--accent)]/50 flex items-center justify-center flex-shrink-0"><Icons.Bot className="w-5 h-5"/></div>}
            <div className={`rounded-lg p-3 max-w-xs md:max-w-md lg:max-w-lg shadow-md animate-fade-in-up ${msg.sender === 'user' ? 'bg-[var(--accent)]/80 text-white' : 'bg-[var(--gray-dark)]/50 text-gray-200'}`} style={{ animation: msg.sender === 'ai' && msg.text ? 'fadeInText 0.5s ease-out' : undefined }}>
              {renderMessage(msg)}
              {msg.sender === 'ai' && msg.actions && (
                <div className="mt-4 border-t border-[var(--border-color)] pt-3">
                  <h4 className="text-xs font-bold uppercase text-[var(--gray)] mb-2">File Changes</h4>
                  <ul className="space-y-1 text-sm mb-3">
                    {msg.actions.map((action, actionIndex) => (
                      <li key={actionIndex} className="flex items-center p-1 bg-black/20 rounded">
                        <span className={`px-1.5 py-0.5 text-xs rounded mr-2 font-semibold ${action.action === 'create' ? 'bg-green-600 text-white' : 'bg-yellow-600 text-black'}`}>
                          {action.action.toUpperCase()}
                        </span>
                        <span className="font-mono text-gray-300 truncate">{action.path}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="text-sm text-green-400">
                    {msg.actionsApplied ? '✓ Changes Applied' : 'Applying changes...'}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {(() => {
          const lastMessage = messages[messages.length - 1];
          const shouldShowLoader = lastMessage?.sender === 'ai' && !lastMessage.text && !lastMessage.isStreaming;
          return shouldShowLoader ? (
            <div className="flex justify-start">
              <div className="bg-[var(--gray-dark)]/50 text-gray-200 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-1">
                    <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
                    <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-300 animate-pulse">Thinking...</span>
                </div>
              </div>
            </div>
          ) : null;
        })()}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-2 border-t border-[var(--border-color)] flex-shrink-0">
        <div className="flex items-center bg-[var(--gray-dark)]/50 rounded-lg p-1 border border-transparent focus-within:border-[var(--accent)] transition-colors">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask AI to edit files or answer questions..."
            className="flex-grow bg-transparent border-none outline-none text-white text-sm resize-none p-2 w-full"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || input.trim() === ''}
            className="bg-[var(--accent)] text-white p-2 rounded-md disabled:bg-[var(--gray)] disabled:cursor-not-allowed hover:brightness-125 transition-all"
          >
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
