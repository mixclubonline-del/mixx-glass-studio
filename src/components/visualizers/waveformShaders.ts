/**
 * WebGL Waveform Shaders
 * GLSL shader source for GPU-accelerated waveform rendering.
 */

export const WAVEFORM_VERTEX_SHADER = `#version 300 es
precision highp float;

// Attributes
in vec2 a_position;  // Normalized position (0-1 range)

// Uniforms
uniform sampler2D u_peakTexture;
uniform float u_peakCount;
uniform float u_amplitude;
uniform float u_centerY;

out float v_intensity;

void main() {
  // Sample peak value from texture
  float peakIndex = a_position.x * u_peakCount;
  float peakValue = texture(u_peakTexture, vec2(a_position.x, 0.5)).r;
  
  // Calculate Y position based on peak value
  // a_position.y is 0 for top half, 1 for bottom half
  float yOffset = peakValue * u_amplitude * 0.92;
  float y = u_centerY + (a_position.y < 0.5 ? -yOffset : yOffset);
  
  // Convert to clip space (-1 to 1)
  vec2 clipPos = vec2(a_position.x * 2.0 - 1.0, 1.0 - y * 2.0);
  gl_Position = vec4(clipPos, 0.0, 1.0);
  
  // Pass intensity to fragment shader for gradient
  v_intensity = abs(peakValue);
}
`;

export const WAVEFORM_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in float v_intensity;

uniform vec3 u_colorLow;   // Cool color (teal)
uniform vec3 u_colorMid;   // Mid color (purple)
uniform vec3 u_colorHigh;  // Hot color (orange)
uniform float u_fillOpacity;

out vec4 fragColor;

void main() {
  vec3 color;
  
  if (v_intensity > 0.8) {
    // Hot zone: orange to yellow
    float t = (v_intensity - 0.8) / 0.2;
    color = mix(u_colorHigh, vec3(1.0, 0.85, 0.4), t);
  } else if (v_intensity > 0.5) {
    // Warm zone: purple to orange
    float t = (v_intensity - 0.5) / 0.3;
    color = mix(u_colorMid, u_colorHigh, t);
  } else {
    // Cool zone: teal to purple
    float t = v_intensity / 0.5;
    color = mix(u_colorLow, u_colorMid, t);
  }
  
  fragColor = vec4(color, u_fillOpacity);
}
`;

// WebGL1 fallback shaders (ES 1.0)
export const WAVEFORM_VERTEX_SHADER_LEGACY = `
precision highp float;

attribute vec2 a_position;

uniform sampler2D u_peakTexture;
uniform float u_peakCount;
uniform float u_amplitude;
uniform float u_centerY;

varying float v_intensity;

void main() {
  float peakValue = texture2D(u_peakTexture, vec2(a_position.x, 0.5)).r;
  
  float yOffset = peakValue * u_amplitude * 0.92;
  float y = u_centerY + (a_position.y < 0.5 ? -yOffset : yOffset);
  
  vec2 clipPos = vec2(a_position.x * 2.0 - 1.0, 1.0 - y * 2.0);
  gl_Position = vec4(clipPos, 0.0, 1.0);
  
  v_intensity = abs(peakValue);
}
`;

export const WAVEFORM_FRAGMENT_SHADER_LEGACY = `
precision highp float;

varying float v_intensity;

uniform vec3 u_colorLow;
uniform vec3 u_colorMid;
uniform vec3 u_colorHigh;
uniform float u_fillOpacity;

void main() {
  vec3 color;
  
  if (v_intensity > 0.8) {
    float t = (v_intensity - 0.8) / 0.2;
    color = mix(u_colorHigh, vec3(1.0, 0.85, 0.4), t);
  } else if (v_intensity > 0.5) {
    float t = (v_intensity - 0.5) / 0.3;
    color = mix(u_colorMid, u_colorHigh, t);
  } else {
    float t = v_intensity / 0.5;
    color = mix(u_colorLow, u_colorMid, t);
  }
  
  gl_FragColor = vec4(color, u_fillOpacity);
}
`;

/**
 * Compile a shader from source
 */
export function compileShader(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  type: number,
  source: string
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('[WebGL] Shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  
  return shader;
}

/**
 * Create and link a shader program
 */
export function createProgram(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) return null;
  
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('[WebGL] Program link error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  
  return program;
}

/**
 * Create a 1D texture from peak data
 */
export function createPeakTexture(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  peaks: Float32Array
): WebGLTexture | null {
  const texture = gl.createTexture();
  if (!texture) return null;
  
  gl.bindTexture(gl.TEXTURE_2D, texture);
  
  // Upload peak data as a single-row texture
  const isWebGL2 = 'texImage2D' in gl && (gl as WebGL2RenderingContext).texStorage2D !== undefined;
  
  if (isWebGL2) {
    const gl2 = gl as WebGL2RenderingContext;
    gl2.texImage2D(
      gl2.TEXTURE_2D,
      0,
      gl2.R32F,
      peaks.length,
      1,
      0,
      gl2.RED,
      gl2.FLOAT,
      peaks
    );
  } else {
    // WebGL1 fallback: use LUMINANCE
    const uint8Peaks = new Uint8Array(peaks.length);
    for (let i = 0; i < peaks.length; i++) {
      uint8Peaks[i] = Math.floor(Math.abs(peaks[i]) * 255);
    }
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.LUMINANCE,
      peaks.length,
      1,
      0,
      gl.LUMINANCE,
      gl.UNSIGNED_BYTE,
      uint8Peaks
    );
  }
  
  // Set texture parameters for linear sampling
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  
  return texture;
}
