/**
 * useAURAAssistant - React hook for AURA AI assistant
 * Phase 37: Proprietary LLM Integration
 * 
 * Provides easy access to the AURA AI for mixing, mastering,
 * and creative assistance directly from React components.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getAURALLMEngine,
  initializeAURALLM,
  type AURAContext,
  type EngineStatus,
  type CompletionResult,
} from '../ai/AURALocalLLMEngine';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  latencyMs?: number;
}

export interface UseAURAAssistantResult {
  // State
  isInitialized: boolean;
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  status: EngineStatus | null;
  
  // Messages
  messages: Message[];
  
  // Actions
  initialize: () => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  streamMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  
  // AURA-specific helpers
  getMixingSuggestions: () => Promise<string>;
  getCreativeIdea: () => Promise<string>;
  getPresetRecommendation: (effectType: 'eq' | 'compressor' | 'reverb' | 'delay' | 'saturation') => Promise<string>;
  
  // Context
  setContext: (context: Partial<AURAContext>) => void;
  context: AURAContext;
}

export function useAURAAssistant(initialContext?: Partial<AURAContext>): UseAURAAssistantResult {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<EngineStatus | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [context, setContextState] = useState<AURAContext>(initialContext || {});
  
  const streamAbortRef = useRef<AbortController | null>(null);
  
  // Initialize
  const initialize = useCallback(async () => {
    if (isInitialized) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const engineStatus = await initializeAURALLM();
      setStatus(engineStatus);
      setIsInitialized(true);
      
      // Add welcome message
      const welcomeMsg: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `Hello! I'm AURA, your AI assistant for music production. I can help you with:

• **Mixing**: Get suggestions for EQ, compression, and balance
• **Mastering**: Prepare your track for release
• **Creative ideas**: Explore new production techniques
• **Technical help**: Understand audio concepts

What are you working on today?`,
        timestamp: Date.now(),
      };
      
      setMessages([welcomeMsg]);
      
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to initialize AURA';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);
  
  // Send message (non-streaming)
  const sendMessage = useCallback(async (content: string) => {
    if (!isInitialized || isLoading) return;
    
    // Add user message
    const userMsg: Message = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);
    
    try {
      const engine = getAURALLMEngine();
      const result = await engine.complete(content, context);
      
      // Add assistant message
      const assistantMsg: Message = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: result.content,
        timestamp: Date.now(),
        latencyMs: result.latencyMs,
      };
      
      setMessages(prev => [...prev, assistantMsg]);
      
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to get response';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, isLoading, context]);
  
  // Stream message
  const streamMessage = useCallback(async (content: string) => {
    if (!isInitialized || isLoading || isStreaming) return;
    
    // Add user message
    const userMsg: Message = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);
    setError(null);
    
    const assistantMsgId = `msg-${Date.now()}-assistant`;
    
    // Add empty assistant message for streaming
    const assistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev, assistantMsg]);
    
    try {
      const engine = getAURALLMEngine();
      let fullContent = '';
      
      for await (const chunk of engine.stream(content, context)) {
        fullContent += chunk;
        
        // Update message content
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMsgId
            ? { ...msg, content: fullContent }
            : msg
        ));
      }
      
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to stream response';
      setError(msg);
    } finally {
      setIsStreaming(false);
    }
  }, [isInitialized, isLoading, isStreaming, context]);
  
  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);
  
  // Set context
  const setContext = useCallback((newContext: Partial<AURAContext>) => {
    setContextState(prev => ({ ...prev, ...newContext }));
  }, []);
  
  // AURA-specific helpers
  const getMixingSuggestions = useCallback(async () => {
    if (!isInitialized) await initialize();
    const engine = getAURALLMEngine();
    return engine.getMixingSuggestions(context);
  }, [isInitialized, initialize, context]);
  
  const getCreativeIdea = useCallback(async () => {
    if (!isInitialized) await initialize();
    const engine = getAURALLMEngine();
    return engine.getCreativeIdea(context);
  }, [isInitialized, initialize, context]);
  
  const getPresetRecommendation = useCallback(async (effectType: 'eq' | 'compressor' | 'reverb' | 'delay' | 'saturation') => {
    if (!isInitialized) await initialize();
    const engine = getAURALLMEngine();
    return engine.getPresetRecommendation(effectType, context);
  }, [isInitialized, initialize, context]);
  
  // Auto-initialize on mount
  useEffect(() => {
    initialize();
    
    return () => {
      if (streamAbortRef.current) {
        streamAbortRef.current.abort();
      }
    };
  }, [initialize]);
  
  return {
    isInitialized,
    isLoading,
    isStreaming,
    error,
    status,
    messages,
    initialize,
    sendMessage,
    streamMessage,
    clearMessages,
    getMixingSuggestions,
    getCreativeIdea,
    getPresetRecommendation,
    setContext,
    context,
  };
}

export default useAURAAssistant;
