// components/AIHub/ImageAnalyzer.tsx
import React, { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { getGeminiAI, fileToBase64 } from '../../utils/gemini';
import LoadingSpinner from '../common/LoadingSpinner';
import { SparklesIcon, ImageIcon } from '../icons';
import { ArrangeClip, ClipId } from '../../hooks/useArrange';
import { TrackData } from '../../App';

interface ImageAnalyzerProps {
  clips: ArrangeClip[];
  tracks: TrackData[];
  selectedTrackId: string | null;
}

const ImageAnalyzer: React.FC<ImageAnalyzerProps> = ({ clips, tracks, selectedTrackId }) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ai = useRef(getGeminiAI());

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImageUrl(URL.createObjectURL(file));
      setAnalysisResult(null);
      setError(null);
    }
  }, []);

  const analyzeImage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) {
      setError("Please upload an image first.");
      return;
    }
    if (!prompt.trim()) {
      setError("Please enter a question or prompt for the image analysis.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const base64Image = await fileToBase64(imageFile);

      const imagePart = {
        inlineData: {
          mimeType: imageFile.type,
          data: base64Image,
        },
      };
      const textPart = {
        text: prompt,
      };

      const response = await ai.current.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
      });

      setAnalysisResult(response.text ?? null);

    } catch (err: any) {
      console.error("Error analyzing image:", err);
      setError(`Failed to analyze image: ${err.message || 'Unknown error'}`);
      setAnalysisResult('Error: Could not analyze the image.');
    } finally {
      setIsLoading(false);
    }
  }, [imageFile, prompt]);

  return (
    <div className="flex flex-col h-full bg-gray-900/60 rounded-lg p-4 shadow-inner">
      <div className="flex-shrink-0 flex items-center mb-4 space-x-4">
        <input
          type="file"
          ref={fileInputRef}
          accept="image/png, image/jpeg"
          onChange={handleImageUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-indigo-700 text-white rounded-lg hover:bg-indigo-600 transition-colors flex items-center space-x-2"
        >
          <ImageIcon className="w-5 h-5" />
          <span>Upload Image</span>
        </button>
        {imageUrl && <span className="text-gray-300 truncate max-w-[200px]">{imageFile?.name}</span>}
      </div>

      <div className="flex-grow flex space-x-4 mb-4">
        <div className="w-1/2 flex-shrink-0 flex items-center justify-center bg-gray-800/50 rounded-lg overflow-hidden relative p-2">
          {imageUrl ? (
            <img src={imageUrl} alt="Uploaded for analysis" className="max-w-full max-h-full object-contain rounded-lg" />
          ) : (
            <div className="flex flex-col items-center text-gray-500">
              <ImageIcon className="w-16 h-16 text-gray-600 mb-4" />
              <p className="text-lg">Upload an image to analyze.</p>
            </div>
          )}
        </div>

        <div className="w-1/2 flex flex-col">
          <form onSubmit={analyzeImage} className="flex-shrink-0 mb-4 space-y-4">
            <div>
              <label htmlFor="analysisPrompt" className="block text-sm font-medium text-gray-300 mb-1">
                Your question about the image:
              </label>
              <textarea
                id="analysisPrompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe this image in detail."
                rows={3}
                className="w-full p-3 rounded-lg bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !imageFile || !prompt.trim()}
            >
              Analyze Image
            </button>
          </form>

          <div className="flex-grow bg-gray-800/50 rounded-lg p-3 shadow-inner overflow-y-auto custom-scrollbar relative">
            {isLoading && <LoadingSpinner message="Analyzing image..." color="indigo" />}
            {error && (
              <div className="text-red-400 text-center p-4">{error}</div>
            )}
            {analysisResult && !isLoading ? (
              <p className="text-gray-200 whitespace-pre-wrap">{analysisResult}</p>
            ) : !isLoading && !error && (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <SparklesIcon className="w-16 h-16 text-indigo-400 mb-4 animate-pulse" />
                <p className="text-lg text-center">Analysis results will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageAnalyzer;
