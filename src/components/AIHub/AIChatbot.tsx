// components/AIHub/AIChatbot.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getPrimeBrainLLM } from '../../ai/PrimeBrainLLM';
import LoadingSpinner from '../common/LoadingSpinner';
import { SparklesIcon } from '../icons';
import { spacing, typography, layout, effects, transitions, composeStyles } from '../../design-system';

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

  const ai = useRef(getPrimeBrainLLM()); // Use PrimeBrainLLM abstraction

  // Scroll to bottom on new message
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const model = isThinkingMode ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
      
      // System instruction explaining MixClub Studio's workflow
      const systemInstruction = `You are an AI assistant for MixClub Studio, a professional digital audio workstation (DAW) with advanced stem separation capabilities.

CRITICAL WORKFLOW UNDERSTANDING:
- When audio files (MP3, WAV, M4A, or other formats) are imported into MixClub Studio, they are AUTOMATICALLY stem-separated into individual stems using AI-powered separation algorithms.
- This is NOT post-processing or manual splitting—stem separation happens immediately upon import as part of the Flow Stem Pipeline.
- The separated stems include: vocals, drums, bass, harmonic (instrumental), perc (percussion), and sub (sub-bass/808s).
- Each separated stem is automatically placed on its own dedicated track on the timeline, aligned at the start position (time 0).
- The stem tracks are organized in a deterministic order: vocals, drums, bass, harmonic, perc, sub.
- Each stem track has its own color coding and belongs to appropriate groups (Vocals, Drums, Instruments).

When users ask about importing audio, splitting tracks, or working with stems, you should explain that:
1. Import automatically triggers stem separation—no separate step needed
2. All stems are placed on individual tracks automatically
3. Users can then edit, mix, and process each stem independently
4. The original file format doesn't matter—MP3, WAV, etc. all go through the same stem separation process

Be helpful, concise, and accurate about the studio's automatic stem separation workflow.`;

      // Prepend system instruction to first message only for context
      const isFirstMessage = messages.length === 0;
      const userContent = isFirstMessage 
        ? `${systemInstruction}\n\nUser question: ${input}`
        : input;

      // Use PrimeBrainLLM streaming
      let fullResponse = '';
      setMessages((prev) => [...prev, { role: 'model', text: '', isThinking: isThinkingMode }]); // Add initial empty model message

      const stream = ai.current.generateTextStream(userContent, undefined, {
        model,
        systemPrompt: isFirstMessage ? systemInstruction : undefined,
        thinkingConfig: isThinkingMode ? { thinkingBudget: 32768 } : undefined,
      });

      for await (const chunk of stream) {
        fullResponse += chunk;
        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage.role === 'model') {
            return [...prev.slice(0, -1), { ...lastMessage, text: fullResponse }];
          }
          return prev;
        });
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
    <div style={composeStyles(
      layout.flex.container('col'),
      { height: '100%' },
      spacing.p(4),
      effects.border.radius.lg,
      {
        background: 'rgba(17, 24, 39, 0.6)',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
      }
    )}>
      <div 
        ref={chatContainerRef} 
        style={composeStyles(
          { flexGrow: 1 },
          layout.overflow.y.auto,
          spacing.p(2),
          spacing.mb(4),
          spacing.gap(4),
          {
            display: 'flex',
            flexDirection: 'column',
          }
        )}
      >
        {messages.length === 0 && (
          <div style={composeStyles(
            layout.flex.container('col'),
            layout.flex.align.center,
            layout.flex.justify.center,
            { height: '100%' },
            {
              color: 'rgba(107, 114, 128, 1)',
            }
          )}>
            <SparklesIcon style={{ 
              width: '64px', 
              height: '64px', 
              color: 'rgba(129, 140, 248, 1)',
              marginBottom: '16px',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }} />
            <p style={composeStyles(
              typography.weight('semibold'),
              {
                fontSize: '1.125rem',
              }
            )}>Start a conversation with Gemini!</p>
            <p style={{
              fontSize: '0.875rem',
            }}>Ask anything about your music, or just general questions.</p>
          </div>
        )}
        {messages.map((msg, index) => (
          <div 
            key={index} 
            style={composeStyles(
              layout.flex.container('row'),
              layout.flex.justify[msg.role === 'user' ? 'end' : 'start']
            )}
          >
            <div style={composeStyles(
              { maxWidth: '70%' },
              effects.border.radius.xl,
              spacing.p(3),
              {
                background: msg.role === 'user' 
                  ? 'rgba(37, 99, 235, 1)'
                  : 'rgba(55, 65, 81, 1)',
                color: msg.role === 'user' 
                  ? 'white'
                  : 'rgb(243, 244, 246)',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              }
            )}>
              <p style={composeStyles(
                typography.weight('semibold'),
                spacing.mb(1)
              )}>{msg.role === 'user' ? 'You' : 'Gemini'}</p>
              <p>{msg.text}</p>
              {msg.isThinking && msg.role === 'model' && (
                <div style={composeStyles(
                  layout.flex.container('row'),
                  layout.flex.align.center,
                  spacing.mt(2),
                  {
                    fontSize: '0.875rem',
                    color: 'rgba(196, 181, 253, 1)',
                  }
                )}>
                  <LoadingSpinner size="sm" color="indigo" message="" />
                  <span style={spacing.ml(2)}>Thinking deeply...</span>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && !isThinkingMode && (
          <div style={composeStyles(
            layout.flex.container('row'),
            layout.flex.justify.start
          )}>
            <div style={composeStyles(
              { maxWidth: '70%' },
              effects.border.radius.xl,
              spacing.p(3),
              {
                background: 'rgba(55, 65, 81, 1)',
                color: 'rgb(243, 244, 246)',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              }
            )}>
              <LoadingSpinner size="sm" color="cyan" message="Gemini is typing..." />
            </div>
          </div>
        )}
      </div>
      <form 
        onSubmit={sendMessage} 
        style={composeStyles(
          { flexShrink: 0 },
          layout.flex.container('row'),
          layout.flex.align.center,
          spacing.gap(2)
        )}
      >
        <label style={composeStyles(
          layout.flex.container('row'),
          layout.flex.align.center,
          spacing.gap(2),
          spacing.p(2),
          effects.border.radius.lg,
          {
            cursor: 'pointer',
            background: 'rgba(31, 41, 55, 0.5)',
          }
        )}>
          <input
            type="checkbox"
            checked={isThinkingMode}
            onChange={() => setIsThinkingMode(!isThinkingMode)}
            style={composeStyles(
              effects.border.radius.default,
              {
                width: '16px',
                height: '16px',
                accentColor: 'rgba(99, 102, 241, 1)',
                border: '1px solid rgba(75, 85, 99, 1)',
              }
            )}
            onFocus={(e) => {
              e.currentTarget.style.outline = '2px solid rgba(99, 102, 241, 1)';
              e.currentTarget.style.outlineOffset = '2px';
            }}
            onBlur={(e) => {
              e.currentTarget.style.outline = 'none';
            }}
          />
          <span style={{
            fontSize: '0.875rem',
            color: 'rgba(209, 213, 219, 1)',
          }}>Deep Think Mode (Pro Model)</span>
        </label>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isThinkingMode ? "Ask a complex question for deep thought..." : "Type your message..."}
          style={composeStyles(
            { flexGrow: 1 },
            spacing.p(3),
            effects.border.radius.lg,
            {
              background: 'rgba(31, 41, 55, 1)',
              color: 'rgb(243, 244, 246)',
              border: '1px solid rgba(55, 65, 81, 1)',
              outline: 'none',
            }
          )}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 1)';
            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(99, 102, 241, 0.5)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'rgba(55, 65, 81, 1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          disabled={isLoading}
        />
        <button
          type="submit"
          style={composeStyles(
            spacing.px(6),
            spacing.py(3),
            effects.border.radius.lg,
            typography.weight('semibold'),
            transitions.transition.standard('all', 200, 'ease-out'),
            {
              background: 'rgba(79, 70, 229, 1)',
              color: 'white',
            }
          )}
          onMouseEnter={(e) => {
            if (!isLoading && input.trim()) {
              e.currentTarget.style.background = 'rgba(99, 102, 241, 1)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading && input.trim()) {
              e.currentTarget.style.background = 'rgba(79, 70, 229, 1)';
            }
          }}
          disabled={isLoading || !input.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default AIChatbot;
