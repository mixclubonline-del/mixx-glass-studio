// Helper function to convert ArrayBuffer to Base64
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
};

// Helper function to convert Base64 to ArrayBuffer
const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
};

interface SerializedAudioBuffer {
    numberOfChannels: number;
    length: number;
    sampleRate: number;
    channelData: string[]; // Base64 encoded Float32Arrays
}

/**
 * Serializes a record of AudioBuffers into a JSON-friendly format.
 * @param buffers Record of AudioBuffers to serialize.
 * @returns A promise that resolves to the serialized buffer record.
 */
export const serializeAudioBuffers = async (
    buffers: Record<string, AudioBuffer>
): Promise<Record<string, SerializedAudioBuffer>> => {
    const serialized: Record<string, SerializedAudioBuffer> = {};
    for (const id in buffers) {
        if (id === 'default') continue; // Don't save the default sine wave
        const buffer = buffers[id];
        const channelData: string[] = [];
        for (let i = 0; i < buffer.numberOfChannels; i++) {
            const data = buffer.getChannelData(i);
            channelData.push(arrayBufferToBase64(data.buffer));
        }
        serialized[id] = {
            numberOfChannels: buffer.numberOfChannels,
            length: buffer.length,
            sampleRate: buffer.sampleRate,
            channelData,
        };
    }
    return serialized;
};

/**
 * Deserializes a record of serialized buffers back into AudioBuffers.
 * @param serializedBuffers Record of serialized buffers.
 * @param ctx The AudioContext to use for creating new AudioBuffers.
 * @returns A promise that resolves to the deserialized AudioBuffer record.
 */
export const deserializeAudioBuffers = async (
    serializedBuffers: Record<string, SerializedAudioBuffer>,
    ctx: AudioContext
): Promise<Record<string, AudioBuffer>> => {
    const buffers: Record<string, AudioBuffer> = {};
    for (const id in serializedBuffers) {
        const s = serializedBuffers[id];
        const newBuffer = ctx.createBuffer(s.numberOfChannels, s.length, s.sampleRate);
        for (let i = 0; i < s.numberOfChannels; i++) {
            const data = new Float32Array(base64ToArrayBuffer(s.channelData[i]));
            newBuffer.copyToChannel(data, i);
        }
        buffers[id] = newBuffer;
    }
    return buffers;
};
