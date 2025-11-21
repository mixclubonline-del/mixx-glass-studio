// components/AIHub/AudioProcessor.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { getGeminiAI, decode, decodeAudioData, encode, createBlob } from '../../utils/gemini';
import LoadingSpinner from '../common/LoadingSpinner';
import { MicrophoneIcon, SpeakerWaveIcon, SparklesIcon } from '../icons';

const AudioProcessor: React.FC<{ audioContext: AudioContext | null }> = ({ audioContext }) => {
  // Transcription state
  const [isRecording, setIsRecording] = useState(false);
  const [inputTranscription, setInputTranscription] = useState('');
  const [outputTranscription, setOutputTranscription] = useState('');
  const [transcriptionHistory, setTranscriptionHistory] = useState<string[]>([]);
  const [isLiveLoading, setIsLiveLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null); // To hold the promise of the live session
  const aiRef = useRef<GoogleGenAI | null>(null);

  // Initialize AI with error handling
  useEffect(() => {
    try {
      aiRef.current = getGeminiAI();
      setApiError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize Gemini AI';
      setApiError(errorMessage);
      console.error('Gemini AI initialization error:', err);
    }
  }, []);

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
    if (!aiRef.current) {
      setTtsError("AI service is not available. Please configure VITE_GEMINI_API_KEY.");
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
            console.error('Live session error:', e);
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
      console.error("Error accessing microphone or starting session:", err);
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
    if (!aiRef.current) {
      setTtsError("AI service is not available. Please configure VITE_GEMINI_API_KEY.");
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
        console.error("Error generating speech:", err);
        setTtsError(`Failed to generate speech: ${err.message || 'Unknown error'}`);
        setIsTtsLoading(false);
    }
  }, [ttsInput, audioContext]);

  return (
    <div className="flex flex-col h-full bg-gray-900/60 rounded-lg p-4 shadow-inner">
      <h3 className="text-xl font-bold text-gray-200 mb-4 border-b border-gray-700 pb-2">Real-time Audio Transcription & TTS</h3>

      {apiError && (
        <div className="flex flex-col items-center justify-center flex-grow text-red-400 p-4 mb-4">
          <SparklesIcon className="w-16 h-16 text-red-400 mb-4" />
          <p className="text-lg font-semibold mb-2">AI Hub Configuration Error</p>
          <p className="text-sm text-center max-w-md">{apiError}</p>
          <p className="text-xs text-gray-500 mt-4">Please set VITE_GEMINI_API_KEY in your .env file</p>
        </div>
      )}

      {/* Audio Transcription Section */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-300 mb-2 flex items-center space-x-2">
          <MicrophoneIcon className="w-6 h-6 text-indigo-400" /> <span>Live Transcription</span>
        </h4>
        <div className="flex items-center space-x-2 mb-3">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`px-5 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2
              ${isRecording ? 'bg-red-600 text-white hover:bg-red-500' : 'bg-indigo-600 text-white hover:bg-indigo-500'}
              disabled:opacity-50 disabled:cursor-not-allowed`}
            disabled={isLiveLoading || !!apiError || !aiRef.current}
          >
            {isLiveLoading ? (
                <LoadingSpinner size="sm" color="white" message="" />
            ) : isRecording ? (
              <>
                <MicrophoneIcon className="w-5 h-5 animate-pulse" /> <span>Stop Recording</span>
              </>
            ) : (
              <>
                <MicrophoneIcon className="w-5 h-5" /> <span>Start Recording</span>
              </>
            )}
          </button>
          {isLiveLoading && !isRecording && (
              <span className="text-gray-400 text-sm">Connecting to Gemini Live...</span>
          )}
        </div>
        
        <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 text-gray-200 h-32 overflow-y-auto custom-scrollbar">
          {inputTranscription.length === 0 && outputTranscription.length === 0 && transcriptionHistory.length === 0 ? (
            <p className="text-gray-500 italic">Press "Start Recording" to begin live transcription...</p>
          ) : (
            <>
              {transcriptionHistory.map((entry, idx) => (
                <p key={idx} className={entry.startsWith('User:') ? 'text-gray-300' : 'text-indigo-300'}>
                    {entry}
                </p>
              ))}
              {inputTranscription && (
                <p className="text-gray-300">User (Live): {inputTranscription}</p>
              )}
              {outputTranscription && (
                <p className="text-indigo-300">AI (Live): {outputTranscription}</p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Text-to-Speech Section */}
      <div>
        <h4 className="text-lg font-semibold text-gray-300 mb-2 flex items-center space-x-2">
          <SpeakerWaveIcon className="w-6 h-6 text-fuchsia-400" /> <span>Text-to-Speech</span>
        </h4>
        <form onSubmit={generateSpeech} className="flex flex-col space-y-3">
          <textarea
            value={ttsInput}
            onChange={(e) => setTtsInput(e.target.value)}
            placeholder="Enter text to convert to speech..."
            rows={3}
            className="w-full p-3 rounded-lg bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
            disabled={isTtsLoading}
          />
          <button
            type="submit"
            className="px-5 py-2 bg-fuchsia-600 text-white rounded-lg font-semibold hover:bg-fuchsia-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            disabled={isTtsLoading || !ttsInput.trim() || !audioContext || !outputNodeRef.current || !!apiError || !aiRef.current}
          >
            {isTtsLoading ? (
              <LoadingSpinner size="sm" color="white" message="" />
            ) : (
              <>
                <SpeakerWaveIcon className="w-5 h-5" /> <span>Generate & Play Speech</span>
              </>
            )}
          </button>
          {ttsError && <p className="text-red-400 text-sm mt-2">{ttsError}</p>}
        </form>
      </div>
    </div>
  );
};

export default AudioProcessor;
