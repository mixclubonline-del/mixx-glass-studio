// components/AIHub/ImageAnalyzer.tsx
import React, { useState, useRef, useCallback } from 'react';
import { getPrimeBrainLLM } from '../../ai/PrimeBrainLLM';
import { fileToBase64 } from '../../utils/gemini';
import LoadingSpinner from '../common/LoadingSpinner';
import { SparklesIcon, ImageIcon } from '../icons';
import { ArrangeClip, ClipId } from '../../hooks/useArrange';
import { TrackData } from '../../App';
import { spacing, typography, layout, effects, transitions, composeStyles } from '../../design-system';

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

  const ai = useRef(getPrimeBrainLLM());

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

      // Use PrimeBrainLLM for image analysis
      const result = await ai.current.analyzeImage(
        base64Image,
        prompt,
        imageFile.type
      );

      setAnalysisResult(result);

    } catch (err: any) {
      console.error("Error analyzing image:", err);
      setError(`Failed to analyze image: ${err.message || 'Unknown error'}`);
      setAnalysisResult('Error: Could not analyze the image.');
    } finally {
      setIsLoading(false);
    }
  }, [imageFile, prompt]);

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
      <div style={composeStyles(
        { flexShrink: 0 },
        layout.flex.container('row'),
        layout.flex.align.center,
        spacing.mb(4),
        spacing.gap(4)
      )}>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/png, image/jpeg"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          style={composeStyles(
            spacing.px(4),
            spacing.py(2),
            effects.border.radius.lg,
            transitions.transition.standard('all', 200, 'ease-out'),
            layout.flex.container('row'),
            layout.flex.align.center,
            spacing.gap(2),
            {
              background: 'rgba(67, 56, 202, 1)',
              color: 'white',
            }
          )}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(79, 70, 229, 1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(67, 56, 202, 1)';
          }}
        >
          <ImageIcon style={{ width: '20px', height: '20px' }} />
          <span>Upload Image</span>
        </button>
        {imageUrl && (
          <span style={{
            color: 'rgba(209, 213, 219, 1)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '200px',
          }}>{imageFile?.name}</span>
        )}
      </div>

      <div style={composeStyles(
        { flexGrow: 1 },
        layout.flex.container('row'),
        spacing.gap(4),
        spacing.mb(4)
      )}>
        <div style={composeStyles(
          { width: '50%', flexShrink: 0 },
          layout.flex.container('row'),
          layout.flex.align.center,
          layout.flex.justify.center,
          effects.border.radius.lg,
          layout.overflow.hidden,
          layout.position.relative,
          spacing.p(2),
          {
            background: 'rgba(31, 41, 55, 0.5)',
          }
        )}>
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt="Uploaded for analysis" 
              style={composeStyles(
                effects.border.radius.lg,
                {
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                }
              )}
            />
          ) : (
            <div style={composeStyles(
              layout.flex.container('col'),
              layout.flex.align.center,
              {
                color: 'rgba(107, 114, 128, 1)',
              }
            )}>
              <ImageIcon style={{ width: '64px', height: '64px', color: 'rgba(75, 85, 99, 1)', marginBottom: '16px' }} />
              <p style={{ fontSize: '1.125rem' }}>Upload an image to analyze.</p>
            </div>
          )}
        </div>

        <div style={composeStyles(
          { width: '50%' },
          layout.flex.container('col')
        )}>
          <form onSubmit={analyzeImage} style={composeStyles(
            { flexShrink: 0 },
            spacing.mb(4),
            spacing.gap(4),
            {
              display: 'flex',
              flexDirection: 'column',
            }
          )}>
            <div>
              <label 
                htmlFor="analysisPrompt" 
                style={composeStyles(
                  typography.weight('medium'),
                  spacing.mb(1),
                  {
                    display: 'block',
                    fontSize: '0.875rem',
                    color: 'rgba(209, 213, 219, 1)',
                  }
                )}
              >
                Your question about the image:
              </label>
              <textarea
                id="analysisPrompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe this image in detail."
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
                  e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 1)';
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(99, 102, 241, 0.5)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(55, 65, 81, 1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              style={composeStyles(
                layout.width.full,
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
                if (!isLoading && imageFile && prompt.trim()) {
                  e.currentTarget.style.background = 'rgba(99, 102, 241, 1)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading && imageFile && prompt.trim()) {
                  e.currentTarget.style.background = 'rgba(79, 70, 229, 1)';
                }
              }}
              disabled={isLoading || !imageFile || !prompt.trim()}
            >
              Analyze Image
            </button>
          </form>

          <div style={composeStyles(
            { flexGrow: 1 },
            effects.border.radius.lg,
            spacing.p(3),
            layout.overflow.y.auto,
            layout.position.relative,
            {
              background: 'rgba(31, 41, 55, 0.5)',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
            }
          )}>
            {isLoading && <LoadingSpinner message="Analyzing image..." color="indigo" />}
            {error && (
              <div style={{
                color: 'rgba(248, 113, 113, 1)',
                textAlign: 'center',
                padding: '16px',
              }}>{error}</div>
            )}
            {analysisResult && !isLoading ? (
              <p style={{
                color: 'rgb(229, 231, 235)',
                whiteSpace: 'pre-wrap',
              }}>{analysisResult}</p>
            ) : !isLoading && !error && (
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
                <p style={{
                  fontSize: '1.125rem',
                  textAlign: 'center',
                }}>Analysis results will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageAnalyzer;
