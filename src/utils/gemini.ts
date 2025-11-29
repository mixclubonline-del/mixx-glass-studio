// utils/gemini.ts
import { GoogleGenAI, Modality } from "@google/genai";

// Initialize the GoogleGenAI client (this assumes VITE_GEMINI_API_KEY is available)
export const getGeminiAI = () => {
    // Creating a new instance each time to ensure the latest API key is used,
    // though for this app, it's globally available via import.meta.env.VITE_GEMINI_API_KEY.
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('VITE_GEMINI_API_KEY is not defined. Please set it in your .env file.');
    }
    return new GoogleGenAI({ apiKey });
};

// Helper functions for audio encoding/decoding (as per Gemini Live API Guidelines)
export function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

export async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

export function encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

export function createBlob(data: Float32Array): { data: string, mimeType: string } {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
    }
    return {
        data: encode(new Uint8Array(int16.buffer)),
        mimeType: 'audio/pcm;rate=16000', // The supported audio MIME type is 'audio/pcm'.
    };
}

export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                // Extract base64 part only
                const base64String = reader.result.split(',')[1];
                resolve(base64String);
            } else {
                reject(new Error("Failed to read file as Data URL"));
            }
        };
        reader.onerror = (error) => reject(error);
    });
};

export const dataUrlToBase64 = (dataUrl: string): string => {
    return dataUrl.split(',')[1];
};
