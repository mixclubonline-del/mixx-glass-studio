// components/AIHub/AIChatbot.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { getGeminiAI } from '../../utils/gemini';
import LoadingSpinner from '../common/LoadingSpinner';
import { SparklesIcon } from '../icons';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean; // For thinking mode
}

const AIChatbot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isThinkingMode, setIsThinkingMode] = useState(false); // New state for thinking mode
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Initialize AI with error handling
  const ai = useRef<GoogleGenAI | null>(null);
  useEffect(() => {
    try {
      ai.current = getGeminiAI();
      setApiError(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize Gemini AI';
      setApiError(errorMessage);
      console.error('Gemini AI initialization error:', error);
    }
  }, []);

  // Scroll to bottom on new message
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !ai.current) return;

    const userMessage: ChatMessage = { role: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const model = isThinkingMode ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
      const config: any = {
        model: model,
        contents: input,
      };

      if (isThinkingMode) {
        config.config = {
          thinkingConfig: { thinkingBudget: 32768 }, // Max budget for 2.5 Pro
        };
      }

      const responseStream = await ai.current.models.generateContentStream(config);

      let fullResponse = '';
      setMessages((prev) => [...prev, { role: 'model', text: '', isThinking: isThinkingMode }]); // Add initial empty model message

      for await (const chunk of responseStream) {
        const textChunk = chunk.text;
        if (textChunk) {
          fullResponse += textChunk;
          setMessages((prev) => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage.role === 'model') {
              return [...prev.slice(0, -1), { ...lastMessage, text: fullResponse }];
            }
            return prev;
          });
        }
      }
    } catch (error) {
      console.error("Error sending message to Gemini:", error);
      setMessages((prev) => [...prev, { role: 'model', text: 'Error: Could not get a response. Please try again.', isThinking: false }]);
    } finally {
      setIsLoading(false);
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage.role === 'model') {
          return [...prev.slice(0, -1), { ...lastMessage, isThinking: false }]; // Clear thinking state
        }
        return prev;
      });
    }
  }, [input, isLoading, isThinkingMode]);

  return (
    <div className="flex flex-col h-full bg-gray-900/60 rounded-lg p-4 shadow-inner">
      <div ref={chatContainerRef} className="flex-grow overflow-y-auto custom-scrollbar p-2 mb-4 space-y-4">
        {apiError && (
          <div className="flex flex-col items-center justify-center h-full text-red-400 p-4">
            <SparklesIcon className="w-16 h-16 text-red-400 mb-4" />
            <p className="text-lg font-semibold mb-2">AI Hub Configuration Error</p>
            <p className="text-sm text-center max-w-md">{apiError}</p>
            <p className="text-xs text-gray-500 mt-4">Please set VITE_GEMINI_API_KEY in your .env file</p>
          </div>
        )}
        {!apiError && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <SparklesIcon className="w-16 h-16 text-indigo-400 mb-4 animate-pulse" />
            <p className="text-lg font-semibold">Start a conversation with Gemini!</p>
            <p className="text-sm">Ask anything about your music, or just general questions.</p>
          </div>
        )}
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] rounded-xl p-3 shadow-md ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-100'
            }`}>
              <p className="font-semibold mb-1">{msg.role === 'user' ? 'You' : 'Gemini'}</p>
              <p>{msg.text}</p>
              {msg.isThinking && msg.role === 'model' && (
                <div className="flex items-center text-sm mt-2 text-indigo-300">
                  <LoadingSpinner size="sm" color="indigo" message="" />
                  <span className="ml-2">Thinking deeply...</span>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && !isThinkingMode && (
          <div className="flex justify-start">
            <div className="bg-gray-700 text-gray-100 max-w-[70%] rounded-xl p-3 shadow-md">
              <LoadingSpinner size="sm" color="cyan" message="Gemini is typing..." />
            </div>
          </div>
        )}
      </div>
      <form onSubmit={sendMessage} className="flex-shrink-0 flex items-center space-x-2">
        <label className="flex items-center space-x-2 cursor-pointer bg-gray-800/50 p-2 rounded-lg">
          <input
            type="checkbox"
            checked={isThinkingMode}
            onChange={() => setIsThinkingMode(!isThinkingMode)}
            className="form-checkbox h-4 w-4 text-indigo-500 rounded border-gray-600 focus:ring-indigo-500"
          />
          <span className="text-gray-300 text-sm">Deep Think Mode (Pro Model)</span>
        </label>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isThinkingMode ? "Ask a complex question for deep thought..." : "Type your message..."}
          className="flex-grow p-3 rounded-lg bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          disabled={isLoading || !!apiError || !ai.current}
        />
        <button
          type="submit"
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading || !input.trim() || !!apiError || !ai.current}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default AIChatbot;
