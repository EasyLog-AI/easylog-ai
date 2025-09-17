'use client';

import { useEffect, useRef } from 'react';

interface RealtimeBlobEffectProps {
  /** When false the effect fades out and pauses rendering. */
  isActive: boolean;
  /** Between 0 and 1, used to drive the shader intensity. */
  intensity: number;
  /** Audio amplitude between 0 and 1, drives the reactive blob effect. */
  audioAmplitude?: number;
}

const vertexShaderSource = `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
  v_uv = (a_position + 1.0) * 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const fragmentShaderSource = `
precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_intensity;
uniform float u_energy;
uniform float u_amplitude;
varying vec2 v_uv;

float sdfRoundedRect(vec2 uv, vec2 size, float radius) {
  vec2 d = abs(uv) - size + radius;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - radius;
}

float sdfBlob(vec2 uv, float t, float amplitude) {
  // Create a rounded rectangle shape that matches the chat input
  vec2 size = vec2(0.90, 0.40); // Adjusted to better match chat input proportions
  float radius = 0.18; // Match chat input border radius (1rem ≈ 16px)

  float baseSdf = sdfRoundedRect(uv, size, radius);

  // Add organic wobble enhanced by audio amplitude
  float r = length(uv);
  float angle = atan(uv.y, uv.x);
  float wobbleIntensity = 0.06 + amplitude * 0.15;
  float wobble = wobbleIntensity * sin(angle * 4.0 + t * 1.2) + wobbleIntensity * 0.7 * cos(angle * 7.0 - t * 1.8);

  // Add audio-reactive pulsing that expands the shape
  float pulse = amplitude * 0.08 * sin(t * 6.0);

  return smoothstep(0.04 + pulse, -0.03, baseSdf + wobble);
}

vec3 palette(float t) {
  vec3 a = vec3(0.38, 0.16, 0.96);
  vec3 b = vec3(0.08, 0.74, 0.92);
  vec3 c = vec3(1.4, 0.6, 0.6);
  vec3 d = vec3(0.6, 0.4, 0.2);
  return a + b * cos(6.28318 * (c * t + d));
}

void main() {
  vec2 uv = (gl_FragCoord.xy / u_resolution.xy) * 2.0 - 1.0;
  uv.x *= u_resolution.x / u_resolution.y;

  float t = u_time * 0.2;
  float amplitude = u_amplitude;

  float blob = sdfBlob(uv, t, amplitude);

  // Audio-reactive ripples
  float rippleFreq = 3.0 + amplitude * 2.0;
  float ripple = sin(uv.x * rippleFreq + t * 8.0) * cos(uv.y * rippleFreq - t * 6.0);

  // Enhanced energy calculation with audio reactivity
  float energy = mix(0.25, 1.0, u_energy);
  float audioEnergy = 1.0 + amplitude * 0.5;

  float base = blob * (0.6 + 0.4 * ripple * u_intensity) * audioEnergy;

  // Color palette with audio-reactive shifts
  vec3 color = palette(t + uv.x * 0.1 + uv.y * 0.1 + amplitude * 0.2) * base * energy;
  float alpha = smoothstep(0.1, 0.8, blob) * 0.7 * u_intensity * energy;

  gl_FragColor = vec4(color, alpha);
}
`;

const RealtimeBlobEffect = ({
  isActive,
  intensity,
  audioAmplitude = 0
}: RealtimeBlobEffectProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number>(0);
  const programRef = useRef<WebGLProgram | null>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const uniformsRef = useRef<{
    resolution: WebGLUniformLocation | null;
    time: WebGLUniformLocation | null;
    intensity: WebGLUniformLocation | null;
    energy: WebGLUniformLocation | null;
    amplitude: WebGLUniformLocation | null;
  } | null>(null);
  const activeRef = useRef(isActive);
  const intensityRef = useRef(intensity);
  const amplitudeRef = useRef(audioAmplitude || 0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: true,
      premultipliedAlpha: false
    });

    if (!gl) {
      return;
    }

    glRef.current = gl;

    const createShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) throw new Error('Unable to create shader');
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(`Could not compile shader:\n${info}`);
      }
      return shader;
    };

    const vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(
      gl.FRAGMENT_SHADER,
      fragmentShaderSource
    );

    const program = gl.createProgram();
    if (!program) {
      throw new Error('Unable to create WebGL program');
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error(`Could not link program:\n${info}`);
    }

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    programRef.current = program;
    // eslint-disable-next-line react-compiler/react-compiler
    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    uniformsRef.current = {
      resolution: gl.getUniformLocation(program, 'u_resolution'),
      time: gl.getUniformLocation(program, 'u_time'),
      intensity: gl.getUniformLocation(program, 'u_intensity'),
      energy: gl.getUniformLocation(program, 'u_energy'),
      amplitude: gl.getUniformLocation(program, 'u_amplitude')
    };

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width * dpr));
      const height = Math.max(1, Math.floor(rect.height * dpr));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      gl.viewport(0, 0, width, height);

      if (uniformsRef.current?.resolution) {
        gl.uniform2f(uniformsRef.current.resolution, width, height);
      }
    };

    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const render = (timestamp: number) => {
      if (!gl || !programRef.current || !uniformsRef.current) return;

      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      if (!activeRef.current && intensityRef.current <= 0.01) {
        animationRef.current = requestAnimationFrame(render);
        return;
      }

      const elapsed = (timestamp - startTimeRef.current) / 1000;

      resize();

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // eslint-disable-next-line react-compiler/react-compiler
      gl.useProgram(programRef.current);

      gl.uniform1f(uniformsRef.current.time, elapsed);
      gl.uniform1f(uniformsRef.current.intensity, intensityRef.current);
      gl.uniform1f(uniformsRef.current.amplitude, amplitudeRef.current);

      const energy = activeRef.current
        ? 0.55 + 0.45 * Math.sin(elapsed * 3.2)
        : 0.0;

      gl.uniform1f(uniformsRef.current.energy, energy);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      observer.disconnect();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (programRef.current) {
        gl.deleteProgram(programRef.current);
        programRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    activeRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    intensityRef.current = intensity;
  }, [intensity]);

  useEffect(() => {
    amplitudeRef.current = audioAmplitude || 0;
  }, [audioAmplitude]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute -inset-2 h-[calc(100%+1rem)] w-[calc(100%+1rem)] opacity-0 transition-opacity duration-500 will-change-transform"
      style={{
        opacity: isActive ? 1 : 0,
        borderRadius: '1.25rem', // Slightly larger radius to account for overflow
        clipPath: 'inset(0.5rem round 1rem)' // Clip to match exact input shape
      }}
    />
  );
};

export default RealtimeBlobEffect;
