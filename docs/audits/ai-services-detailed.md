# AI/LLM Services - Detailed Technical Audit

## Google Gemini API

### Dependencies
- `@google/genai` (^1.28.0) - Google Generative AI SDK
- `@google/generative-ai` (^0.24.1) - Alternative Gemini SDK

### Usage Locations

#### Core Integration (`src/utils/gemini.ts`)
```typescript
// Primary Gemini client initialization
export const getGeminiAI = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  return new GoogleGenAI({ apiKey });
};

// Audio encoding/decoding utilities
- decode() - Base64 to Uint8Array
- encode() - Uint8Array to Base64
- decodeAudioData() - Audio buffer creation
- createBlob() - PCM audio blob creation
```

#### Live Audio Processing (`src/components/AIHub/AudioProcessor.tsx`)
```typescript
// Real-time audio transcription
- GoogleGenAI Live API
- Real-time audio streaming
- Transcription with live updates
- Text-to-speech synthesis
```

**Usage Pattern:**
- Creates live session with Gemini
- Streams PCM audio data
- Receives real-time transcriptions
- Synthesizes speech responses

#### Chat Interface (`src/components/AIHub/AIChatbot.tsx`)
```typescript
// Text-based chat with Gemini
- generateContent() for chat responses
- Context-aware conversations
- Prime Brain integration
```

#### Image Analysis (`src/components/AIHub/ImageAnalyzer.tsx`)
```typescript
// Image analysis with Gemini Vision
- Image upload and base64 encoding
- Multi-modal prompts (image + text)
- Analysis results for DAW context
```

#### Supabase Functions

**1. Music Context Analysis** (`supabase/functions/analyze-music-context/index.ts`)
```typescript
// Analyzes audio chromagrams for musical context
- Key detection
- Chord identification
- Scale type determination
- Harmonic tension calculation
- Next chord prediction

Model: 'google/gemini-2.5-flash'
Temperature: 0.3
Max Tokens: 300
```

**2. Mix Analysis** (`supabase/functions/analyze-mix-ai/index.ts`)
```typescript
// Analyzes mix characteristics
- LUFS analysis
- Dynamic range assessment
- Frequency balance
- Mix recommendations

Model: 'google/gemini-2.5-flash'
Temperature: 0.7
```

**3. Preset Suggestions** (`supabase/functions/suggest-preset/index.ts`)
```typescript
// Suggests plugin presets based on context
- Parameter recommendations
- Preset name generation
- Explanation of settings

Model: 'google/gemini-2.5-flash'
Temperature: 0.7
```

**4. Auto-Tune Settings** (`supabase/functions/suggest-mixxtune-settings/index.ts`)
```typescript
// Suggests MixxTune settings
- Speed, strength, tolerance values
- Style recommendations (Future, Drake, Natural, T-Pain)

Model: 'google/gemini-2.5-flash'
Temperature: 0.4
Max Tokens: 400
```

### API Call Patterns

#### Pattern 1: Direct Gemini API
```typescript
const ai = getGeminiAI();
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: { parts: [textPart, imagePart] }
});
```

#### Pattern 2: Live API
```typescript
const session = await ai.preview.liveSessions.create({
  model: 'gemini-2.5-flash',
  config: { speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' }}}}
});
```

#### Pattern 3: Via Lovable Gateway
```typescript
fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${LOVABLE_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'google/gemini-2.5-flash',
    messages: [...]
  })
})
```

### Current Limitations

1. **Generic LLM**: Not optimized for audio-specific tasks
2. **Prompt Engineering**: Requires careful prompt design
3. **Context Window**: Limited context for complex audio analysis
4. **Latency**: API calls add latency to real-time features
5. **Cost**: Per-request pricing can be expensive at scale
6. **Dependency**: External service dependency

---

## Lovable AI Gateway

### Current Usage

**Locations:**
- `supabase/functions/analyze-music-context/index.ts`
- `supabase/functions/analyze-mix-ai/index.ts`
- `supabase/functions/suggest-preset/index.ts`
- `supabase/functions/suggest-mixxtune-settings/index.ts`

### Purpose
- Routes AI requests to Gemini
- Provides unified API interface
- Handles authentication

### Limitations
- Additional latency layer
- External dependency
- No audio-specific optimizations
- No Mixx Recall integration

---

## Proprietary Replacement Strategy

### Phase 1: Abstraction Layer (2-3 weeks)

#### Create `PrimeBrainLLM` Interface
```typescript
interface PrimeBrainLLM {
  // Text generation
  generateText(prompt: string, context: AudioContext): Promise<string>;
  
  // Audio analysis
  analyzeAudio(audioBuffer: AudioBuffer, task: AnalysisTask): Promise<AnalysisResult>;
  
  // Image analysis
  analyzeImage(image: ImageData, prompt: string): Promise<string>;
  
  // Live transcription
  createLiveSession(config: LiveConfig): Promise<LiveSession>;
  
  // Context-aware routing
  routeRequest(request: LLMRequest): Promise<LLMResponse>;
}
```

**Implementation:**
- Abstract Gemini API behind interface
- Add audio-specific prompt templates
- Implement context-aware routing
- Add Mixx Recall integration points

### Phase 2: Direct API Integration (1-2 weeks)

#### Replace Lovable Gateway
- Replace all Lovable Gateway calls with direct Gemini API
- Remove external dependency
- Reduce latency
- Add audio-specific optimizations

**Files to Update:**
- All Supabase functions using Lovable Gateway
- Replace with direct `GoogleGenAI` calls
- Add error handling and retry logic

### Phase 3: Audio-Specific Optimizations (1-2 months)

#### Prompt Engineering
- Create audio-specific prompt templates
- Optimize for mixing/engineering tasks
- Add musical context understanding
- Implement hip-hop production patterns

#### Context Management
- Build context window management
- Implement audio-aware context injection
- Add Mixx Recall context integration
- Optimize for DAW workflows

### Phase 4: Proprietary LLM (Long-term: 12-18 months)

#### Training Data
- Mixing/engineering knowledge base
- Musical theory and context
- Hip-hop production patterns
- User workflow patterns (Mixx Recall)

#### Model Architecture
- Audio-aware architecture
- Multi-modal capabilities (audio + text + image)
- Real-time processing optimization
- Context-aware inference

#### Infrastructure
- Training infrastructure
- Inference server
- Model serving
- Performance optimization

---

## Implementation Plan

### Immediate Actions (Next 2-3 weeks)

1. **Create Abstraction Layer**
   - File: `src/ai/PrimeBrainLLM.ts`
   - Interface for all LLM operations
   - Gemini implementation behind interface

2. **Replace Lovable Gateway**
   - Update all Supabase functions
   - Direct Gemini API calls
   - Remove Lovable dependency

3. **Audio-Specific Prompts**
   - Create prompt templates
   - Optimize for audio tasks
   - Add context injection

### Short-term (1-2 months)

1. **Context Management**
   - Build context window system
   - Integrate Mixx Recall
   - Optimize for DAW workflows

2. **Performance Optimization**
   - Reduce latency
   - Add caching
   - Optimize API calls

### Long-term (12-18 months)

1. **Proprietary Model**
   - Training infrastructure
   - Model development
   - Deployment system

---

## Risk Assessment

### Low Risk
- **Abstraction Layer**: Simple interface creation
- **Lovable Gateway Replacement**: Direct API replacement

### Medium Risk
- **Audio-Specific Optimizations**: Requires prompt engineering expertise
- **Context Management**: Complex system design

### High Risk
- **Proprietary LLM**: Significant investment, uncertain ROI
- **Training Infrastructure**: Requires ML expertise

---

## Success Metrics

### Phase 1-2 (Abstraction & Direct API)
- Reduced latency: 20-30% improvement
- Removed external dependency: Lovable Gateway
- Maintained functionality: 100% feature parity

### Phase 3 (Optimizations)
- Better audio insights: 30-40% improvement
- Reduced API costs: 20-30% reduction
- Improved user experience: Measurable feedback

### Phase 4 (Proprietary LLM)
- Audio-specific accuracy: 50%+ improvement
- Reduced costs: 60-70% reduction
- Competitive advantage: Unique capabilities

---

## Cost Analysis

### Current Costs (Estimated)
- Gemini API: ~$0.001-0.01 per request
- Lovable Gateway: Additional layer (cost included in Gemini)
- Estimated monthly: $100-500 (depending on usage)

### After Optimization
- Direct API: Same as Gemini (no Lovable overhead)
- Caching: 20-30% cost reduction
- Optimized prompts: 10-20% cost reduction
- Estimated monthly: $70-350

### Proprietary LLM (Long-term)
- Training: One-time $50k-200k
- Infrastructure: $500-2000/month
- Estimated break-even: 2-3 years at current usage

---

*Context improved by Giga AI - Used comprehensive codebase analysis to document all AI/LLM service dependencies, usage patterns, and replacement strategies.*



