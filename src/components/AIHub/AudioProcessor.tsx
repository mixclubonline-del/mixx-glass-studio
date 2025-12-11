// components/AIHub/AudioProcessor.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getPrimeBrainLLM } from '../../ai/PrimeBrainLLM';
import { decode, decodeAudioData, encode, createBlob } from '../../utils/gemini';
import LoadingSpinner from '../common/LoadingSpinner';
import { MicrophoneIcon, SpeakerWaveIcon, SparklesIcon } from '../icons';
import { spacing, typography, layout, effects, transitions, composeStyles } from '../../design-system';
import { als } from '../../utils/alsFeedback';

const AudioProcessor: React.FC<{ audioContext: AudioContext | null }> = ({ audioContext }) => {
  // Transcription state
  const [isRecording, setIsRecording] = useState(false);
  const [inputTranscription, setInputTranscription] = useState('');
  const [outputTranscription, setOutputTranscription] = useState('');
  const [transcriptionHistory, setTranscriptionHistory] = useState<string[]>([]);
  const [isLiveLoading, setIsLiveLoading] = useState(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sessionRef = useRef<any>(null); // Live session reference
  const sessionPromiseRef = useRef<Promise<any> | null>(null); // Live session promise
  const aiRef = useRef(getPrimeBrainLLM());

  // TTS state
  const [ttsInput, setTtsInput] = useState('');
  const [isTtsLoading, setIsTtsLoading] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const outputNodeRef = useRef<GainNode | null>(null);
  const nextStartTimeRef = useRef(0);
  const playingSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Initialize output audio context for TTS if not already done
  useEffect(() => {
    if (audioContext && !outputNodeRef.current) {
        outputNodeRef.current = audioContext.createGain();
        outputNodeRef.current.connect(audioContext.destination);
    }
    return () => {
        if (outputNodeRef.current) {
            outputNodeRef.current.disconnect();
            outputNodeRef.current = null;
        }
    };
  }, [audioContext]);


  // Cleanup live session on unmount
  useEffect(() => {
    return () => {
      if (sessionPromiseRef.current) {
        sessionPromiseRef.current.then((session) => {
          if (session && session.close) session.close();
        });
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect();
      }
      if (audioSourceRef.current) {
          audioSourceRef.current.stop();
          audioSourceRef.current.disconnect();
      }
      playingSourcesRef.current.forEach(source => source.stop());
      playingSourcesRef.current.clear();
    };
  }, []);

  const startRecording = useCallback(async () => {
    if (!audioContext) {
      alert("AudioContext is not available.");
      return;
    }
    setIsLiveLoading(true);
    setInputTranscription('');
    setOutputTranscription('');
    setTranscriptionHistory([]);
    setTtsError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      const source = audioContext.createMediaStreamSource(stream);
      const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = scriptProcessor;

      scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
        const pcmBlob = createBlob(inputData);
        sessionPromiseRef.current?.then((session) => {
          if (session && session.sendRealtimeInput) {
            session.sendRealtimeInput({ media: pcmBlob });
          }
        });
      };

      source.connect(scriptProcessor);
      scriptProcessor.connect(audioContext.destination); // Connect to output to keep it alive

      sessionPromiseRef.current = aiRef.current.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.debug('Live session opened');
            setIsRecording(true);
            setIsLiveLoading(false);
            nextStartTimeRef.current = audioContext.currentTime;
          },
          onmessage: async (message: LiveServerMessage) => {
            const serverContent = message.serverContent;
            const outputTranscriptionPart = serverContent?.outputTranscription;
            const inputTranscriptionPart = serverContent?.inputTranscription;

            if (outputTranscriptionPart) {
              setOutputTranscription((prev) => prev + outputTranscriptionPart.text);
            } else if (inputTranscriptionPart) {
              setInputTranscription((prev) => prev + inputTranscriptionPart.text);
            }
            if (serverContent?.turnComplete) {
              setTranscriptionHistory((prev) => [...prev, `User: ${inputTranscription}`, `AI: ${outputTranscription}`]);
              setInputTranscription('');
              setOutputTranscription('');
            }
            
            // Handle audio output
            const base64EncodedAudioString = serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64EncodedAudioString && audioContext && outputNodeRef.current) {
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContext.currentTime);
                const audioBuffer = await decodeAudioData(
                    decode(base64EncodedAudioString),
                    audioContext,
                    24000, // Sample rate for model output
                    1,
                );
                const sourceNode = audioContext.createBufferSource();
                sourceNode.buffer = audioBuffer;
                sourceNode.connect(outputNodeRef.current);
                sourceNode.addEventListener('ended', () => {
                    playingSourcesRef.current.delete(sourceNode);
                });

                sourceNode.start(nextStartTimeRef.current);
                nextStartTimeRef.current = nextStartTimeRef.current + audioBuffer.duration;
                playingSourcesRef.current.add(sourceNode);
            }

            const interrupted = serverContent?.interrupted;
            if (interrupted) {
                playingSourcesRef.current.forEach(source => source.stop());
                playingSourcesRef.current.clear();
                nextStartTimeRef.current = 0;
            }

          },
          onerror: (e: ErrorEvent) => {
            als.error('Live session error', e);
            setTtsError(`Live session error: ${e.message}`);
            stopRecording();
          },
          onclose: (e: CloseEvent) => {
            console.debug('Live session closed', e);
            stopRecording();
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
      });

      source.connect(scriptProcessor);
      scriptProcessor.connect(audioContext.destination);

    } catch (err: any) {
      als.error("Error accessing microphone or starting session", err);
      setTtsError(`Microphone access denied or session failed: ${err.message}`);
      setIsLiveLoading(false);
      setIsRecording(false);
    }
  }, [audioContext, inputTranscription, outputTranscription]);

  const stopRecording = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then((session) => {
        if (session && session.close) session.close();
      });
      sessionPromiseRef.current = null;
    }
    setIsRecording(false);
    setIsLiveLoading(false);
    playingSourcesRef.current.forEach(source => source.stop());
    playingSourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  }, []);

  const generateSpeech = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ttsInput.trim() || !audioContext || !outputNodeRef.current) {
      setTtsError("Please enter text to convert to speech.");
      return;
    }

    setIsTtsLoading(true);
    setTtsError(null);
    
    try {
        if (audioSourceRef.current) { // Stop any currently playing TTS audio
            audioSourceRef.current.stop();
            audioSourceRef.current.disconnect();
            audioSourceRef.current = null;
        }

        const response = await aiRef.current.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: ttsInput }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' }, // You can choose other voices
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

        if (base64Audio && audioContext) {
            const audioBuffer = await decodeAudioData(
                decode(base64Audio),
                audioContext,
                24000,
                1,
            );
            
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputNodeRef.current);
            source.start(0);
            audioSourceRef.current = source;
            source.onended = () => {
                audioSourceRef.current = null;
                setIsTtsLoading(false);
            };
        } else {
            setTtsError("No audio data received from TTS API.");
            setIsTtsLoading(false);
        }
    } catch (err: any) {
        als.error("Error generating speech", err);
        setTtsError(`Failed to generate speech: ${err.message || 'Unknown error'}`);
        setIsTtsLoading(false);
    }
  }, [ttsInput, audioContext]);

  // Note: AudioProcessor uses live.connect() which may need to be implemented in PrimeBrainLLM
  // For now, this assumes the live API is available via aiRef.current.live
  const Modality = { AUDIO: 'AUDIO' } as const;
  type LiveServerMessage = any; // Should be imported from @google/genai if needed

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
      <h3 style={composeStyles(
        typography.weight('bold'),
        spacing.mb(4),
        effects.border.bottom(),
        spacing.pb(2),
        {
          fontSize: '1.25rem',
          color: 'rgb(229, 231, 235)',
          borderBottom: '1px solid rgba(55, 65, 81, 1)',
        }
      )}>Real-time Audio Transcription & TTS</h3>

      {/* Audio Transcription Section */}
      <div style={spacing.mb(6)}>
        <h4 style={composeStyles(
          typography.weight('semibold'),
          spacing.mb(2),
          layout.flex.container('row'),
          layout.flex.align.center,
          spacing.gap(2),
          {
            fontSize: '1.125rem',
            color: 'rgba(209, 213, 219, 1)',
          }
        )}>
          <MicrophoneIcon style={{ width: '24px', height: '24px', color: 'rgba(129, 140, 248, 1)' }} /> 
          <span>Live Transcription</span>
        </h4>
        <div style={composeStyles(
          layout.flex.container('row'),
          layout.flex.align.center,
          spacing.gap(2),
          spacing.mb(3)
        )}>
          <button
            onClick={isRecording ? stopRecording : startRecording}
            style={composeStyles(
              spacing.px(5),
              spacing.py(2),
              effects.border.radius.lg,
              typography.weight('semibold'),
              transitions.transition.standard('all', 200, 'ease-out'),
              layout.flex.container('row'),
              layout.flex.align.center,
              spacing.gap(2),
              {
                background: isRecording ? 'rgba(220, 38, 38, 1)' : 'rgba(79, 70, 229, 1)',
                color: 'white',
              }
            )}
            onMouseEnter={(e) => {
              if (!isLiveLoading) {
                e.currentTarget.style.background = isRecording 
                  ? 'rgba(239, 68, 68, 1)' 
                  : 'rgba(99, 102, 241, 1)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLiveLoading) {
                e.currentTarget.style.background = isRecording 
                  ? 'rgba(220, 38, 38, 1)' 
                  : 'rgba(79, 70, 229, 1)';
              }
            }}
            disabled={isLiveLoading}
          >
            {isLiveLoading ? (
                <LoadingSpinner size="sm" color="white" message="" />
            ) : isRecording ? (
              <>
                <MicrophoneIcon style={{ 
                  width: '20px', 
                  height: '20px',
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                }} /> 
                <span>Stop Recording</span>
              </>
            ) : (
              <>
                <MicrophoneIcon style={{ width: '20px', height: '20px' }} /> 
                <span>Start Recording</span>
              </>
            )}
          </button>
          {isLiveLoading && !isRecording && (
              <span style={{
                color: 'rgba(156, 163, 175, 1)',
                fontSize: '0.875rem',
              }}>Connecting to Gemini Live...</span>
          )}
        </div>
        
        <div style={composeStyles(
          spacing.p(3),
          effects.border.radius.lg,
          {
            background: 'rgba(31, 41, 55, 1)',
            border: '1px solid rgba(55, 65, 81, 1)',
            color: 'rgb(229, 231, 235)',
            height: '128px',
            overflowY: 'auto',
          }
        )}>
          {inputTranscription.length === 0 && outputTranscription.length === 0 && transcriptionHistory.length === 0 ? (
            <p style={{
              color: 'rgba(107, 114, 128, 1)',
              fontStyle: 'italic',
            }}>Press "Start Recording" to begin live transcription...</p>
          ) : (
            <>
              {transcriptionHistory.map((entry, idx) => (
                <p 
                  key={idx} 
                  style={{
                    color: entry.startsWith('User:') 
                      ? 'rgba(209, 213, 219, 1)' 
                      : 'rgba(196, 181, 253, 1)',
                  }}
                >
                    {entry}
                </p>
              ))}
              {inputTranscription && (
                <p style={{ color: 'rgba(209, 213, 219, 1)' }}>User (Live): {inputTranscription}</p>
              )}
              {outputTranscription && (
                <p style={{ color: 'rgba(196, 181, 253, 1)' }}>AI (Live): {outputTranscription}</p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Text-to-Speech Section */}
      <div>
        <h4 style={composeStyles(
          typography.weight('semibold'),
          spacing.mb(2),
          layout.flex.container('row'),
          layout.flex.align.center,
          spacing.gap(2),
          {
            fontSize: '1.125rem',
            color: 'rgba(209, 213, 219, 1)',
          }
        )}>
          <SpeakerWaveIcon style={{ width: '24px', height: '24px', color: 'rgba(232, 121, 249, 1)' }} /> 
          <span>Text-to-Speech</span>
        </h4>
        <form onSubmit={generateSpeech} style={composeStyles(
          layout.flex.container('col'),
          spacing.gap(3)
        )}>
          <textarea
            value={ttsInput}
            onChange={(e) => setTtsInput(e.target.value)}
            placeholder="Enter text to convert to speech..."
            rows={3}
            style={composeStyles(
              layout.width.full,
              spacing.p(3),
              effects.border.radius.lg,
              {
                background: 'rgba(31, 41, 55, 1)',
                color: 'rgb(243, 244, 246)',
                border: '1px solid rgba(55, 65, 81, 1)',
                outline: 'none',
                resize: 'vertical',
              }
            )}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(217, 70, 239, 1)';
              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(217, 70, 239, 0.5)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(55, 65, 81, 1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            disabled={isTtsLoading}
          />
          <button
            type="submit"
            style={composeStyles(
              spacing.px(5),
              spacing.py(2),
              effects.border.radius.lg,
              typography.weight('semibold'),
              transitions.transition.standard('all', 200, 'ease-out'),
              layout.flex.container('row'),
              layout.flex.align.center,
              layout.flex.justify.center,
              spacing.gap(2),
              {
                background: 'rgba(192, 38, 211, 1)',
                color: 'white',
              }
            )}
            onMouseEnter={(e) => {
              if (!isTtsLoading && ttsInput.trim() && audioContext && outputNodeRef.current) {
                e.currentTarget.style.background = 'rgba(217, 70, 239, 1)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isTtsLoading && ttsInput.trim() && audioContext && outputNodeRef.current) {
                e.currentTarget.style.background = 'rgba(192, 38, 211, 1)';
              }
            }}
            disabled={isTtsLoading || !ttsInput.trim() || !audioContext || !outputNodeRef.current}
          >
            {isTtsLoading ? (
              <LoadingSpinner size="sm" color="white" message="" />
            ) : (
              <>
                <SpeakerWaveIcon style={{ width: '20px', height: '20px' }} /> 
                <span>Generate & Play Speech</span>
              </>
            )}
          </button>
          {ttsError && (
            <p style={{
              color: 'rgba(248, 113, 113, 1)',
              fontSize: '0.875rem',
              marginTop: '8px',
            }}>{ttsError}</p>
          )}
        </form>
      </div>
    </div>
  );
};

export default AudioProcessor;
